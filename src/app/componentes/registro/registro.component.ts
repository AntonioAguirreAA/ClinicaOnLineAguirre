// registro.component.ts
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RecaptchaModule } from 'ng-recaptcha';
import Swal from 'sweetalert2';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    RecaptchaModule,
    FormsModule,
  ],
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' = 'paciente';
  recaptchaResponse: string | null = null;
  especialidades: { id: string; nombre: string }[] = [];
  nuevaEspecialidad: string = '';
  imgFiles: File[] = [];

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      tipoUsuario: ['paciente', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: [
        '',
        [Validators.required, Validators.min(18), Validators.max(120)],
      ],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
      obraSocial: [''],
      especialidades: this.fb.array([], []),
      nuevaEspecialidad: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.cargarEspecialidades();
  }

  get especialidadesArray(): FormArray {
    return this.registroForm.get('especialidades') as FormArray;
  }

  async cargarEspecialidades() {
    const { data, error } = await this.supabase
      .from('especialidades')
      .select('*');
    if (!error && data) {
      this.especialidades = data;
    }
  }

  agregarEspecialidadExistente(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const especialidadId = selectElement.value;
    const especialidad = this.especialidades.find(
      (e) => e.id === especialidadId
    );
    if (
      especialidad &&
      !this.especialidadesArray.value.includes(especialidad.nombre)
    ) {
      this.especialidadesArray.push(this.fb.control(especialidad.nombre));
    }
  }

  async agregarEspecialidad() {
    const nombre = this.registroForm.get('nuevaEspecialidad')?.value?.trim();
    if (!nombre) return;

    const { data, error } = await this.supabase
      .from('especialidades')
      .insert({ nombre })
      .select()
      .single();

    if (!error && data) {
      this.especialidades.push(data);
      this.registroForm.get('nuevaEspecialidad')?.reset();
      Swal.fire('Éxito', 'Especialidad agregada correctamente', 'success');
    }
  }

  setTipoUsuario(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);
  }

  agregarImagen($event: any) {
    const file = $event.target.files[0];
    if (!file || !file.type.startsWith('image')) return;
    this.imgFiles.push(file);
  }

  async subirImagenes(
    uid: string
  ): Promise<{ imgUrl1: string; imgUrl2?: string }> {
    const urls: any = {};

    for (let i = 0; i < this.imgFiles.length; i++) {
      const file = this.imgFiles[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `usuarios/${uid}/${i + 1}-${safeName}`;

      const { data, error } = await this.supabase.storage
        .from('imagenes')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error al subir imagen:', error);
        throw new Error('Error al subir imagen: ' + error.message);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(path);

      urls[`imgUrl${i + 1}`] = publicUrlData?.publicUrl;
    }

    return urls;
  }

  onCaptchaResolved(response: string | null) {
    this.recaptchaResponse = response;
  }

  async onSubmit() {
    if (this.registroForm.invalid || !this.recaptchaResponse) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const formData = this.registroForm.value;

    const { data: user, error } = await this.supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error || !user?.user) {
      Swal.fire('Error', 'No se pudo registrar el usuario.', 'error');
      return;
    }

    const uid = user.user.id;
    const imagenes = await this.subirImagenes(uid);

    const usuario = {
      id: uid,
      tipo_usuario: formData.tipoUsuario,
      nombre: formData.nombre,
      apellido: formData.apellido,
      edad: formData.edad,
      dni: formData.dni,
      email: formData.email,
      obra_social:
        formData.tipoUsuario === 'paciente' ? formData.obraSocial : null,
      especialidades:
        formData.tipoUsuario === 'especialista'
          ? (formData.especialidades as string[])
          : [],
      aprobado: formData.tipoUsuario === 'especialista' ? false : true,
      img_url_1: imagenes.imgUrl1,
      img_url_2: imagenes.imgUrl2 ?? null,
    };

    const insertResult = await this.supabase.from('usuarios').insert(usuario);

    if (insertResult.error) {
      Swal.fire('Error', 'No se pudo guardar en la base de datos.', 'error');
      return;
    }

    Swal.fire('Éxito', 'Registro completado. Revisa tu correo.', 'success');
    this.router.navigate(['/home']);
  }
}
