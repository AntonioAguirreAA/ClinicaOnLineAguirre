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
import { HighlightUserTypeDirective } from '../../directivas/usuario-highlight.directive';
import { NombreEspecialistaPipe } from '../../pipes/nombre-especialista.pipe';
import { HoverEffectDirective } from '../../directivas/hover-effect.directive';
import { CensurarEmailPipe } from '../../pipes/censurar-email.pipe';

/*  Interface con los nombres EXACTOS de la tabla (snake_case)  */
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  email: string;
  tipo_usuario: 'paciente' | 'especialista' | 'administrador';
  obra_social: string | null;
  aprobado: boolean;
  img_url_1: string | null;
  img_url_2: string | null;
  especialidades: string[] | null;
}

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
    NombreEspecialistaPipe,
    HoverEffectDirective,
    CensurarEmailPipe,
  ],
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  especialidades: Especialidad[] = [];

  isAdmin = false;
  tipoUsuario: 'paciente' | 'especialista' | 'administrador' = 'paciente';

  registroForm!: FormGroup;
  imagenSeleccionada: File | null = null;
  pacienteSeleccionado: Usuario | null = null;

  constructor(private auth: AuthService, private fb: FormBuilder) {}

  /* ============================================================= */
  async ngOnInit(): Promise<void> {
    try {
      const perfil = await this.auth.getUserProfile();
      this.isAdmin = perfil.tipoUsuario === 'administrador';
      if (!this.isAdmin) {
        Swal.fire('Acceso denegado', 'Solo administradores.', 'error');
        return;
      }

      this.inicializarFormulario();
      await Promise.all([this.cargarUsuarios(), this.cargarEspecialidades()]);
    } catch {
      Swal.fire('Error', 'No se pudo verificar el perfil.', 'error');
    }
  }

  /* ---------------- CARGA SIN ALIAS ---------------- */
  async cargarUsuarios(): Promise<void> {
    const { data, error } = await this.auth
      .getSupabase()
      .from('usuarios')
      .select('*');

    if (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
      return;
    }
    this.usuarios = data as Usuario[];
  }

  async cargarEspecialidades(): Promise<void> {
    const { data } = await this.auth
      .getSupabase()
      .from('especialidades')
      .select('*');
    this.especialidades = data as Especialidad[];
  }

  /* =============================================================
     HABILITAR / INHABILITAR ESPECIALISTA
  ============================================================= */
  habilitarEspecialista(u: Usuario) {
    this.actualizarEspecialista(u, true);
  }
  inhabilitarEspecialista(u: Usuario) {
    this.actualizarEspecialista(u, false);
  }

  private async actualizarEspecialista(u: Usuario, aprobado: boolean) {
    const { error } = await this.auth
      .getSupabase()
      .from('usuarios')
      .update({ aprobado })
      .eq('id', u.id);

    if (error) {
      Swal.fire('Error', 'No se pudo actualizar.', 'error');
    } else {
      await Swal.fire(
        'Éxito',
        `Especialista ${aprobado ? 'habilitado' : 'inhabilitado'}.`,
        'success'
      );
      this.cargarUsuarios();
    }
  }

  /* =============================================================
     FORMULARIO DE ALTA
  ============================================================= */
  inicializarFormulario(): void {
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

    const obraCtrl = this.registroForm.get('obraSocial');
    const espCtrl = this.registroForm.get('especialidad');

    if (tipo === 'paciente') {
      obraCtrl?.setValidators(Validators.required);
      espCtrl?.clearValidators();
    } else if (tipo === 'especialista') {
      espCtrl?.setValidators(Validators.required);
      obraCtrl?.clearValidators();
    } else {
      obraCtrl?.clearValidators();
      espCtrl?.clearValidators();
    }
    obraCtrl?.updateValueAndValidity();
    espCtrl?.updateValueAndValidity();
  }

  seleccionarImagen(e: Event) {
    this.imagenSeleccionada = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  /* ---------- crear usuario (JSON snake_case) ---------- */
  async crearUsuario(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      await Swal.fire('Error', 'Completa todos los campos.', 'error');
      return;
    }

    const { email, password, ...f } = this.registroForm.value;

    /* 1) sign-up */
    const signUp = await this.auth
      .getSupabase()
      .auth.signUp({ email, password });
    const uid = signUp.data.user!.id;

    /* 2) imagen */
    let img_url_1 = '';
    if (this.imagenSeleccionada) {
      const safe = this.imagenSeleccionada.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        '_'
      );
      const path = `usuarios/${uid}/${safe}`;
      const up = await this.auth
        .getSupabase()
        .storage.from('imagenes')
        .upload(path, this.imagenSeleccionada, { upsert: true });
      if (!up.error) {
        img_url_1 = this.auth
          .getSupabase()
          .storage.from('imagenes')
          .getPublicUrl(path).data.publicUrl;
      }
    }

    /* 3) insert */
    const { error } = await this.auth
      .getSupabase()
      .from('usuarios')
      .insert({
        id: uid,
        nombre: f.nombre,
        apellido: f.apellido,
        edad: f.edad,
        dni: f.dni,
        email,
        tipo_usuario: f.tipoUsuario,
        obra_social: f.tipoUsuario === 'paciente' ? f.obraSocial : null,
        especialidades:
          f.tipoUsuario === 'especialista' ? [f.especialidad] : [],
        aprobado: f.tipoUsuario === 'especialista' ? false : true,
        img_url_1,
        img_url_2: '',
      });

    if (error) {
      await Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
      return;
    }

    await Swal.fire('Éxito', 'Usuario creado.', 'success');
    await this.cargarUsuarios();
    this.registroForm.reset({ tipoUsuario: 'administrador' });
    this.imagenSeleccionada = null;
  }

  /* =============================================================
     DESCARGA DE TURNOS
  ============================================================= */
  async descargarTurnos(u: Usuario) {
    if (u.tipo_usuario !== 'paciente') return;

    const { data, error } = await this.auth
      .getSupabase()
      .from('turnos')
      .select('fecha, especialidad, especialista, estado')
      .eq('paciente', u.id);

    if (error || !data?.length) {
      Swal.fire('Sin turnos', 'Este paciente no tiene turnos.', 'info');
      return;
    }

    const sheetData = data.map((t) => ({
      Fecha: new Date(t.fecha).toLocaleString(),
      Especialidad: t.especialidad,
      Especialista: t.especialista ?? 'No asignado',
      Estado: t.estado ?? '—',
    }));

    const sheet = XLSX.utils.json_to_sheet(sheetData);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Turnos');
    XLSX.writeFile(book, `turnos-${u.nombre}-${u.apellido}.xlsx`);
  }

  mostrarHistoriaClinica(u: Usuario) {
    this.pacienteSeleccionado =
      this.pacienteSeleccionado?.id === u.id ? null : u;
  }

  /* =============================================================
     EXPORTAR LISTA
  ============================================================= */
  exportarUsuariosExcel() {
    if (!this.isAdmin) return;

    const sheet = XLSX.utils.json_to_sheet(
      this.usuarios.map((u) => ({
        Nombre: u.nombre,
        Apellido: u.apellido,
        Email: u.email,
        Tipo: u.tipo_usuario,
      }))
    );
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Usuarios');
    XLSX.writeFile(book, 'lista-usuarios.xlsx');
  }
}
