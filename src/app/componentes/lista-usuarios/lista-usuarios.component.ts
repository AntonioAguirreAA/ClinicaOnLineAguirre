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
import * as XLSX from 'xlsx-js-style';

import { AuthService } from '../../servicios/auth.service';
import { HighlightUserTypeDirective } from '../../directivas/usuario-highlight.directive';
import { NombreEspecialistaPipe } from '../../pipes/nombre-especialista.pipe';
import { HoverEffectDirective } from '../../directivas/hover-effect.directive';
import { CensurarEmailPipe } from '../../pipes/censurar-email.pipe';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
   EXPORTAR LISTA (EXCLUYE ADMIN + CAMPOS NO DESEADOS) CON ESTILO
=============================================================*/
exportarUsuariosExcel() {
  if (!this.isAdmin) return;

  /* 1. Filtrar y omitir campos */
  const datos = this.usuarios
    .filter(u => u.tipo_usuario !== 'administrador')
    .map(({ id, img_url_1, img_url_2, especialidades, ...rest }) => rest);

  if (!datos.length) {
    Swal.fire('Sin datos', 'No hay usuarios para exportar.', 'info');
    return;
  }

  /* 2. Crear hoja SIN cabeceras */
  const headers = Object.keys(datos[0]);
  const ws = XLSX.utils.json_to_sheet(datos, {
    skipHeader: true,   // importante
  });

  /* 3. Insertar cabeceras en A1 */
  XLSX.utils.sheet_add_aoa(ws,
    [headers.map(h => h.toUpperCase())],
    { origin: 'A1' }
  );

  /* 4. Estilos */
  const rango = XLSX.utils.decode_range(ws['!ref']!);

  // Encabezado (fila 0)
  headers.forEach((_, c) => {
    const celda = XLSX.utils.encode_cell({ r: 0, c });
    ws[celda].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '007bff' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top:    { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left:   { style: 'thin', color: { rgb: '000000' } },
        right:  { style: 'thin', color: { rgb: '000000' } },
      },
    };
  });

  // Datos (fila 1 en adelante)
  for (let R = 1; R <= rango.e.r; R++) {
    for (let C = 0; C <= rango.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { sz: 12 },
        border: {
          top:    { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left:   { style: 'thin', color: { rgb: '000000' } },
          right:  { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }
  }

  /* 5. Ancho de columnas simple */
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  /* 6. Descargar */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
  XLSX.writeFile(wb, 'lista-usuarios.xlsx');
}

async descargarTurnosPdf(u: Usuario) {
  if (u.tipo_usuario !== 'paciente') return;

  /* 1. Traer turnos del paciente */
  const { data: turnos, error } = await this.auth
    .getSupabase()
    .from('turnos')
    .select('id, fecha_hora, especialidad, estado, especialista_id')
    .eq('paciente_id', u.id);

  if (error || !turnos?.length) {
    Swal.fire('Sin turnos', 'Este paciente no posee turnos.', 'info');
    return;
  }

  /* 2. Obtener nombres de especialistas (mapa) */
  const ids = [...new Set(turnos.map(t => t.especialista_id))];
  const { data: especialistas } = await this.auth
    .getSupabase()
    .from('usuarios')
    .select('id, nombre, apellido')
    .in('id', ids);

  const mapaEsp = new Map(
    (especialistas ?? []).map(e => [e.id, `${e.nombre} ${e.apellido}`])
  );

  /* 3. Crear PDF */
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setFontSize(16).text('Listado de turnos', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Paciente: ${u.nombre} ${u.apellido}`, 14, 30);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 38);

  /* 4. Tabla */
  autoTable(doc, {
    startY: 46,
    head: [['Día', 'Fecha', 'Especialista', 'Especialidad', 'Estado']],
    body: turnos.map(t => {
      const fecha = new Date(t.fecha_hora);
      return [
        fecha.toLocaleDateString('es-AR', { weekday: 'long' }),
        fecha.toLocaleString(),
        mapaEsp.get(t.especialista_id) ?? '—',
        t.especialidad,
        t.estado,
      ];
    }),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 123, 255], textColor: 255 },
  });

  doc.save(`turnos-${u.nombre}-${u.apellido}.pdf`);
}

}
