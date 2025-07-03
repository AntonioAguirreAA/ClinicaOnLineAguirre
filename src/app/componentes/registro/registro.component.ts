import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule, FormGroup, FormBuilder, Validators,
  FormArray, FormsModule
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule }  from '@angular/common';
import { RecaptchaModule } from 'ng-recaptcha';
import Swal from 'sweetalert2';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector   : 'app-register',
  standalone : true,
  templateUrl: './registro.component.html',
  styleUrls  : ['./registro.component.scss'],
  imports    : [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    RecaptchaModule,
    FormsModule,
  ],
})
export class RegistroComponent implements OnInit {

  /* ---------------- pasos ---------------- */
  step: 0 | 1 = 0;    // 0 = elegir rol · 1 = formulario

  /* ---------------- formulario ----------- */
  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' = 'paciente';

  /* ---------------- utilidades ----------- */
  recaptchaResponse: string | null = null;
  especialidades : { id:string; nombre:string }[] = [];
  imgFiles       : File[] = [];

  /* ---------------- supabase ------------- */
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  constructor(private fb: FormBuilder, private router: Router) {}

  /* ===============================================================
     lifecycle
     =============================================================== */
  ngOnInit(): void {
    this.registroForm = this.fb.group({
      tipoUsuario       : ['paciente', Validators.required],
      nombre            : ['', [Validators.required, Validators.minLength(2)]],
      apellido          : ['', [Validators.required, Validators.minLength(2)]],
      edad              : ['', [Validators.required, Validators.min(18), Validators.max(120)]],
      dni               : ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
      obraSocial        : [''],
      especialidades    : this.fb.array([], []),
      nuevaEspecialidad : [''],
      email             : ['', [Validators.required, Validators.email]],
      password          : ['', [Validators.required, Validators.minLength(6)]],
    });

    this.cargarEspecialidades();
  }

  /* ===============================================================
     getters helpers
     =============================================================== */
  get especialidadesArray(): FormArray {
    return this.registroForm.get('especialidades') as FormArray;
  }

  /* ===============================================================
     carga de especialidades existentes
     =============================================================== */
  async cargarEspecialidades() {
    const { data, error } = await this.supabase
      .from('especialidades')
      .select('*');

    if (!error && data) {
      this.especialidades = data;
    }
  }

  /* ===============================================================
     pasos: seleccionar tipo  →  avanzar
     =============================================================== */
  setTipoUsuario(tipo: 'paciente' | 'especialista'): void {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);
    this.step = 1;                       // → muestra el formulario
  }

  volverPaso0(): void {
    this.step = 0;                       // ← vuelve a la selección
    this.imgFiles = [];
  }

  /* ===============================================================
     especialidades (especialista)
     =============================================================== */
  agregarEspecialidadExistente(event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    const idSel    = selectEl.value;
    const esp      = this.especialidades.find(e => e.id === idSel);
    if (esp && !this.especialidadesArray.value.includes(esp.nombre)) {
      this.especialidadesArray.push(this.fb.control(esp.nombre));
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
      Swal.fire('Éxito', 'Especialidad agregada', 'success');
    }
  }

  /* ===============================================================
     manejo de imágenes
     =============================================================== */
  agregarImagen(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (file && file.type.startsWith('image')) this.imgFiles.push(file);
  }

  async subirImagenes(uid: string): Promise<{ imgUrl1: string; imgUrl2?: string }> {
    const urls: Record<string,string> = {};
    for (let i = 0; i < this.imgFiles.length; i++) {
      const file     = this.imgFiles[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path     = `usuarios/${uid}/${i+1}-${safeName}`;

      const { error } = await this.supabase.storage
        .from('imagenes')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (error) throw new Error('Error al subir imagen: ' + error.message);

      const { data: pub } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(path);

      urls[`imgUrl${i+1}`] = pub?.publicUrl;
    }
    return urls as any;
  }

  /* ===============================================================
     captcha
     =============================================================== */
  onCaptchaResolved(resp: string | null) { this.recaptchaResponse = resp; }

  /* ===============================================================
     envío del formulario
     =============================================================== */
  async onSubmit() {
    if (this.step !== 1)        return;
    if (this.registroForm.invalid || !this.recaptchaResponse) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const f = this.registroForm.value;

    /* ---------- alta de usuario en Auth ---------- */
    const { data: auth, error: eAuth } = await this.supabase.auth.signUp({
      email   : f.email,
      password: f.password,
    });
    if (eAuth || !auth?.user) {
      Swal.fire('Error', 'No se pudo registrar el usuario', 'error');
      return;
    }

    /* ---------- imágenes ---------- */
    const uid   = auth.user.id;
    const imgs  = await this.subirImagenes(uid);

    /* ---------- inserción en tabla usuarios ------- */
    const nuevo = {
      id            : uid,
      tipo_usuario  : f.tipoUsuario,
      nombre        : f.nombre,
      apellido      : f.apellido,
      edad          : f.edad,
      dni           : f.dni,
      email         : f.email,
      obra_social   : f.tipoUsuario === 'paciente' ? f.obraSocial : null,
      especialidades: f.tipoUsuario === 'especialista' ? f.especialidades : [],
      aprobado      : f.tipoUsuario === 'especialista' ? false : true,
      img_url_1     : imgs.imgUrl1,
      img_url_2     : imgs.imgUrl2 ?? null,
    };

    const { error } = await this.supabase.from('usuarios').insert(nuevo);
    if (error) {
      Swal.fire('Error', 'No se pudo guardar en la base de datos', 'error');
      return;
    }

    Swal.fire('Éxito', 'Registro completado. Revisa tu correo', 'success');
    this.router.navigate(['/home']);
  }
}
