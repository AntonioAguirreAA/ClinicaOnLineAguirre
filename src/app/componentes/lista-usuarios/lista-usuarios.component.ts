import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AuthService } from '../../servicios/auth.service';
import { Usuario } from '../../clases/usuario';

import { HighlightUserTypeDirective } from '../../directivas/usuario-highlight.directive';
import { HoverEffectDirective } from '../../directivas/hover-effect.directive';
import { NombreEspecialistaPipe } from '../../pipes/nombre-especialista.pipe';
import { CensurarEmailPipe } from '../../pipes/censurar-email.pipe';

interface Especialidad {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighlightUserTypeDirective,
    HoverEffectDirective,
    NombreEspecialistaPipe,
    CensurarEmailPipe,
  ],
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  isAdmin = false;

  registroForm!: FormGroup;
  imagenSeleccionada: File | null = null;
  tipoUsuario: 'paciente' | 'especialista' | 'administrador' = 'paciente';

  especialidades: Especialidad[] = [];
  pacienteSeleccionado: Usuario | null = null;

  constructor(private auth: AuthService, private fb: FormBuilder) {}

  /* ---------------------------------------------------------------- */
  async ngOnInit() {
    const supa = this.auth.getSupabase();

    /* perfil */
    try {
      const perfil = await this.auth.getUserProfile();
      this.isAdmin = perfil.tipoUsuario === 'administrador';
      if (!this.isAdmin) {
        Swal.fire('Acceso denegado', 'Solo administradores.', 'error');
        return;
      }
      this.inicializarFormulario();
    } catch (e) {
      Swal.fire('Error', 'No se pudo verificar el perfil', 'error');
      return;
    }

    /* datos */
    await this.cargarUsuarios();
    await this.cargarEspecialidades();
  }

  /* ---------------------------------------------------------------- */
  async cargarUsuarios() {
    const { data, error } = await this.auth
      .getSupabase()
      .from('usuarios')
      .select('*');

    if (error) {
      Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
      return;
    }
    this.usuarios = data as Usuario[];
  }

  async cargarEspecialidades() {
    const { data, error } = await this.auth
      .getSupabase()
      .from('especialidades')
      .select('*');

    if (!error) this.especialidades = data as Especialidad[];
  }

  /* ----------------------------------------------------------------
     ACCIONES SOBRE ESPECIALISTAS */
  async habilitarEspecialista(u: Usuario) {
    await this.actualizarEspecialista(u.id, true, 'habilitado');
  }
  async inhabilitarEspecialista(u: Usuario) {
    await this.actualizarEspecialista(u.id, false, 'inhabilitado');
  }
  private async actualizarEspecialista(
    uid: string,
    aprobado: boolean,
    msg: string
  ) {
    const { error } = await this.auth
      .getSupabase()
      .from('usuarios')
      .update({ aprobado })
      .eq('id', uid);

    if (error) {
      Swal.fire('Error', 'No se pudo actualizar.', 'error');
    } else {
      Swal.fire(
        msg.charAt(0).toUpperCase() + msg.slice(1),
        `El especialista ha sido ${msg}.`,
        'success'
      );
      this.cargarUsuarios();
    }
  }

  /* ----------------------------------------------------------------
     CREAR USUARIO */
  inicializarFormulario() {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: [
        '',
        [Validators.required, Validators.min(18), Validators.max(120)],
      ],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      tipoUsuario: ['administrador', Validators.required],
      obraSocial: [''],
      especialidad: [''],
    });
  }

  setTipoUsuario(tipo: 'paciente' | 'especialista' | 'administrador') {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);

    if (tipo === 'paciente') {
      this.registroForm.get('obraSocial')?.setValidators(Validators.required);
      this.registroForm.get('especialidad')?.clearValidators();
    } else if (tipo === 'especialista') {
      this.registroForm.get('especialidad')?.setValidators(Validators.required);
      this.registroForm.get('obraSocial')?.clearValidators();
    } else {
      this.registroForm.get('obraSocial')?.clearValidators();
      this.registroForm.get('especialidad')?.clearValidators();
    }
    this.registroForm.get('obraSocial')?.updateValueAndValidity();
    this.registroForm.get('especialidad')?.updateValueAndValidity();
  }

  seleccionarImagen(e: any) {
    this.imagenSeleccionada = e.target.files[0] ?? null;
  }

  /* ---------------------------------------------------------------- */
  async crearUsuario(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      await Swal.fire('Error', 'Completa todos los campos.', 'error');
      return; // <-- devuelve void
    }

    /* 1) sign-up -------------------------------------------------- */
    const { email, password, ...form } = this.registroForm.value;
    let signUp;
    try {
      signUp = await this.auth.getSupabase().auth.signUp({ email, password });
    } catch (err: any) {
      await Swal.fire('Error', err.message, 'error');
      return; // <-- salida temprana
    }

    const uid = signUp.data.user!.id;

    /* 2) subir imagen -------------------------------------------- */
    let imgUrl1 = '';
    if (this.imagenSeleccionada) {
      const safe = this.imagenSeleccionada.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        '_'
      );
      const path = `usuarios/${uid}/${safe}`;

      const { error } = await this.auth
        .getSupabase()
        .storage.from('imagenes')
        .upload(path, this.imagenSeleccionada, { upsert: true });

      if (!error) {
        imgUrl1 = this.auth
          .getSupabase()
          .storage.from('imagenes')
          .getPublicUrl(path).data.publicUrl;
      }
    }

    /* 3) insertar en tabla usuarios ------------------------------ */
    const usuario: Usuario = {
      id: uid,
      nombre: form.nombre,
      apellido: form.apellido,
      edad: form.edad,
      dni: form.dni,
      email,
      tipoUsuario: form.tipoUsuario,
      obraSocial: form.tipoUsuario === 'paciente' ? form.obraSocial : null,
      especialidades:
        form.tipoUsuario === 'especialista' ? [form.especialidad] : [],
      aprobado: form.tipoUsuario === 'especialista' ? false : true,
      imgUrl1,
      imgUrl2: '',
    };

    const { error: insertErr } = await this.auth
      .getSupabase()
      .from('usuarios')
      .insert(usuario);

    if (insertErr) {
      await Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
      return; // <-- error => salida
    }

    /* éxito */
    await Swal.fire('Éxito', 'Usuario creado.', 'success');
    await this.cargarUsuarios();
    this.registroForm.reset({ tipoUsuario: 'administrador' });
    this.imagenSeleccionada = null;
    return; // <-- camino de éxito
  }

  /* ----------------------------------------------------------------
     VER HISTORIA CLÍNICA / DESCARGAR TURNOS
     (solo la descarga se muestra adaptada al Storage-RLS en Supabase
     si ya migraste los turnos).  Aquí se asume una tabla `turnos`.  */
  async descargarTurnos(u: Usuario) {
    if (u.tipoUsuario !== 'paciente') return;
    const { data, error } = await this.auth
      .getSupabase()
      .from('turnos')
      .select('fecha, especialidad, especialista, estado')
      .eq('paciente', u.id);

    if (error || !data?.length) {
      Swal.fire('Sin turnos', 'Este paciente no tiene turnos.', 'info');
      return;
    }

    /* normaliza fechas */
    const rows = data.map((t) => ({
      Fecha: new Date(t.fecha).toLocaleString(),
      Especialidad: t.especialidad,
      Especialista: t.especialista ?? 'No asignado',
      Estado: t.estado ?? '—',
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Turnos');
    XLSX.writeFile(book, `turnos-${u.nombre}-${u.apellido}.xlsx`);
  }

  mostrarHistoriaClinica(u: Usuario) {
    this.pacienteSeleccionado =
      this.pacienteSeleccionado?.id === u.id ? null : u;
  }

  /* ----------------------------------------------------------------
     EXPORTAR LISTA COMPLETA */
  exportarUsuariosExcel() {
    if (!this.isAdmin) return;
    const sheet = XLSX.utils.json_to_sheet(
      this.usuarios.map((u) => ({
        Nombre: u.nombre,
        Apellido: u.apellido,
        Email: u.email,
        Tipo: u.tipoUsuario,
      }))
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Usuarios');
    XLSX.writeFile(book, 'lista-usuarios.xlsx');
  }
}
