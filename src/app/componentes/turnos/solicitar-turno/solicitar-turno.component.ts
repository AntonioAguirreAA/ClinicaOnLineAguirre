/* -----------------------------------------------------------------
 * SolicitarTurnoComponent  –  versión Supabase
 * ----------------------------------------------------------------- */
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseClient } from '@supabase/supabase-js';
import moment from 'moment';
import 'moment/locale/es';

import { AuthService } from '../../../servicios/auth.service';
import { Usuario } from '../../../clases/usuario';
import { Turno } from '../../../clases/turno';
import { Especialidad } from '../../../clases/especialidad';

import Swal from 'sweetalert2';
import { SUPABASE } from '../../../app.config';

moment.locale('es');

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class SolicitarTurnoComponent implements OnInit {
  especialistas: any[] = [];
  especialidades: any[] = [];
  pacientes: any[] = [];
  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = [];
  cargando = true;
    horariosReservados = new Set<string>(); 

  usuario: Usuario | null = null;
  tipoUsuario = '';
  pacienteSeleccionado: Usuario | null = null;

  especialistaSeleccionado: any = null;
  especialidadesEspecialista: any[] = [];
  especialidadSeleccionada = '';
  diaSeleccionado = '';
  horarioSeleccionado = '';

  captchaValido = false;

  /* ---------- Supabase ---------- */
  private sb = inject<SupabaseClient>(SUPABASE);
  constructor(private auth: AuthService, private router: Router) {}

  /* ---------------- lifecycle ---------------- */
  async ngOnInit() {
    try {
      this.usuario = await this.auth.getUserProfile();
      this.tipoUsuario = this.usuario?.tipoUsuario || '';

      await this.cargarEspecialidades();
      await this.cargarEspecialistas();

      if (this.tipoUsuario === 'administrador') {
        await this.cargarPacientes();
      }
    } catch (e) {
      console.error('Error al cargar especialistas:', e);
    } finally {
      this.cargando = false;
    }
  }


  /* -------------- cargar especialistas -------------- */
  async cargarEspecialistas() {
    const { data, error } = await this.sb
      .from('usuarios')
      .select('id, nombre, apellido, img_url_1, tipo_usuario')
      .eq('tipo_usuario', 'especialista');

    if (error) { console.error(error); return; }

    /* map */
    const especialistas = data!.map(u => ({
      uid: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      imagen: u.img_url_1 || 'ruta-a-imagen-por-defecto.jpg',
      tipoUsuario: u.tipo_usuario,
      especialidades: [] as any[]
    }));

    /* disponibilidad (tabla disponibilidad, PK = uid especialista) */
    for (const esp of especialistas) {
      const { data } = await this.sb
        .from('disponibilidad')
        .select('especialidades')
        .eq('id', esp.uid)
        .single();
      esp.especialidades = data?.especialidades || [];
    }

    this.especialistas = especialistas;
  }

  /* -------------- cargar pacientes (admin) ---------- */
  async cargarPacientes() {
    const { data, error } = await this.sb
      .from('usuarios')
      .select('id, nombre, apellido, tipo_usuario')
      .eq('tipo_usuario', 'paciente');

    if (error) { console.error(error); return; }

    this.pacientes = data!.map(u => ({
      uid: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      tipoUsuario: u.tipo_usuario,
    }));
  }

  /* -------------- cargar especialidades ------------- */
  async cargarEspecialidades() {
    const { data, error } = await this.sb
      .from('especialidades')
      .select('id, nombre');

    if (error) { console.error(error); return; }

    this.especialidades = data!.map(e =>
      new Especialidad(
        e.id,
        e.nombre,
        'https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/especialidades%2Fespecialidad-por-defecto.png?alt=media&token=0218ba02-1cb2-47cb-b5d2-15f2b6687961'
      )
    );
  }

  /* -------------- selección especialista ------------ */
  seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.especialidadesEspecialista = especialista.especialidades.map((esp: any) => {
      const match = this.especialidades.find(e => e.nombre === esp.nombre);
      return match ?? new Especialidad('desconocido', esp.nombre, '...');
    });
  }

  /* ---------------- selección especialidad ------------ */
  seleccionarEspecialidad(esp: Especialidad) {
    this.especialidadSeleccionada = esp.nombre;

    const disp = this.especialistaSeleccionado.especialidades
      .find((e: any) => e.nombre === esp.nombre)?.disponibilidad;

    this.diasDisponibles = disp ? this.generarDiasDisponibles(disp) : [];
    this.diaSeleccionado = '';               // reset
    this.horariosDisponibles = [];
    this.horariosReservados.clear();
  }

  generarDiasDisponibles(disp: any[]): string[] {
    const arr: string[] = [];
    const hoy = moment();
    for (let i = 0; i < 15; i++) {
      const dia = hoy.clone().add(i, 'days');
      const dSemana = dia.format('dddd').toLowerCase();
      if (disp.some(d => d.dia.toLowerCase() === dSemana)) {
        arr.push(dia.format('YYYY-MM-DD'));
      }
    }
    return arr;
  }

  /* ---------------- seleccionar día ------------------ */
  async seleccionarDia(d: string) {
    this.diaSeleccionado = d;
    this.horarioSeleccionado = '';
    this.horariosReservados.clear();

    /* ❶ genera las franjas como antes */
    const disp = this.especialistaSeleccionado.especialidades
      .find((e: any) => e.nombre === this.especialidadSeleccionada)
      ?.disponibilidad.filter((dd: any) =>
        dd.dia.toLowerCase() === moment(d).format('dddd').toLowerCase()
      );

    this.horariosDisponibles = [];
    disp?.forEach((d: any) => {
      let desde = moment(d.desde, 'HH:mm');
      const hasta = moment(d.hasta, 'HH:mm');
      while (desde.isBefore(hasta)) {
        const sig = desde.clone().add(30, 'minutes');
        if (sig.isAfter(hasta)) break;
        this.horariosDisponibles.push(`${desde.format('HH:mm')} - ${sig.format('HH:mm')}`);
        desde.add(30, 'minutes');
      }
    });

    /* ❷ consulta turnos ya reservados para ese especialista-día-especialidad */
    const startDay = moment(d).startOf('day').toISOString();
    const endDay   = moment(d).endOf('day').toISOString();

    const { data, error } = await this.sb
      .from('turnos')
      .select('fecha_hora')
      .eq('especialista_id', this.especialistaSeleccionado.uid)
      .eq('especialidad', this.especialidadSeleccionada)
      .not('estado', 'in', '("cancelado")')
      .gte('fecha_hora', startDay)
      .lte('fecha_hora', endDay);

    if (!error && data) {
      data.forEach(t => {
        const hhmm = moment(t.fecha_hora).format('HH:mm');
        this.horariosReservados.add(hhmm);   // sólo la hora inicial
      });
    }
  }

  seleccionarHorario(h: string) { this.horarioSeleccionado = h; }

  /* ---------------- confirmar turno ------------------ */
  async confirmarTurno() {
  const pacienteUID =
    this.tipoUsuario === 'administrador'
      ? this.pacienteSeleccionado?.id
      : this.usuario?.id;

  if (!this.especialistaSeleccionado || !this.especialidadSeleccionada ||
      !this.diaSeleccionado || !this.horarioSeleccionado || !pacienteUID) {
    Swal.fire('Faltan datos', 'Completa todos los campos', 'error');
    return;
  }

  /* ❶ Objeto con los nombres EXACTOS de la tabla */
  const nuevoTurno = {
    fecha_hora: new Date(`${this.diaSeleccionado} ${this.horarioSeleccionado.split(' - ')[0]}`),
    estado: 'pendiente',
    especialidad: this.especialidadSeleccionada,
    paciente_id:      pacienteUID,
    especialista_id:  this.especialistaSeleccionado.uid,
    resenaEspecialista: '',
    resenaPaciente: '',
    diagnostico: '',
    "historiaClinica": [],
    comentario: '',
    encuesta: []
  };

  /* ❷ Inserción */
  const { error } = await this.sb
    .from('turnos')
    .insert(nuevoTurno);

  if (!error) {
    this.router.navigate(['/mis-turnos-paciente']);
  } else {
    console.error(error);
    Swal.fire('Error', 'No se pudo guardar el turno', 'error');
  }
}

}
