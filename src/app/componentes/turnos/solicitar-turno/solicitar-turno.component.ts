/* -----------------------------------------------------------------
 * SolicitarTurnoComponent – versión Supabase
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
  especialidades: Especialidad[] = [];
  pacientes: any[] = [];

  especialidadesEspecialista: any[] = [];          // ← lista del paso 2
  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = [];
  horariosReservados = new Set<string>();

  usuario: Usuario | null = null;
  tipoUsuario = '';
  pacienteSeleccionado: Usuario | null = null;

  especialistaSeleccionado: any = null;
  especialidadSeleccionada = '';
  diaSeleccionado = '';
  horarioSeleccionado = '';

  step = 1;                                         // 1 = especialistas
  cargando = true;

  /* ----------- Supabase ----------- */
  private sb = inject<SupabaseClient>(SUPABASE);
  constructor(private auth: AuthService, private router: Router) {}

  /* -------- lifecycle ------------ */
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
      console.error('Error al cargar datos:', e);
    } finally {
      this.cargando = false;
    }
  }

  /* --------- carga de datos -------- */
  async cargarEspecialidades() {
    const { data, error } = await this.sb
      .from('especialidades')
      .select('id, nombre, img_url');

    if (error) { console.error(error); return; }

    this.especialidades = data!.map(e =>
      new Especialidad(
        e.id,
        e.nombre,
        e.img_url ||
          'https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/especialidades%2Fespecialidad-por-defecto.png?alt=media'
      )
    );
  }

  async cargarEspecialistas() {
    const { data, error } = await this.sb
      .from('usuarios')
      .select('id, nombre, apellido, img_url_1, tipo_usuario')
      .eq('tipo_usuario', 'especialista');

    if (error) { console.error(error); return; }

    const especialistas = data!.map(u => ({
      uid: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      imagen: u.img_url_1 || 'ruta-a-imagen-por-defecto.jpg',
      tipoUsuario: u.tipo_usuario,
      especialidades: [] as any[],
    }));

    /* traer disponibilidad por especialista */
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

  async cargarPacientes() {
    const { data, error } = await this.sb
      .from('usuarios')
      .select('id, nombre, apellido')
      .eq('tipo_usuario', 'paciente');

    if (error) { console.error(error); return; }

    this.pacientes = data!.map(u => ({
      uid: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
    }));
  }

  /* ---------- selección de ESPECIALISTA (Paso 1) ------------- */
  seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;

    /* mapa de especialidades propias + imagen */
    this.especialidadesEspecialista = esp.especialidades.map((e: any) => {
      const base = this.especialidades.find(x => x.nombre === e.nombre);
      return {
        ...e,
        imgUrl: base?.imgUrl ||
          'https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/especialidades%2Fespecialidad-por-defecto.png?alt=media',
      };
    });

    /* limpia pasos posteriores */
    this.especialidadSeleccionada = '';
    this.diasDisponibles = [];
    this.horariosDisponibles = [];
    this.diaSeleccionado = '';
    this.horarioSeleccionado = '';
    this.horariosReservados.clear();

    this.step = 2;                                  // → especialidades
  }

  /* ---------- selección de ESPECIALIDAD (Paso 2) ------------- */
  seleccionarEspecialidad(esp: any) {
    this.especialidadSeleccionada = esp.nombre;

    const disp = this.especialistaSeleccionado.especialidades
      .find((e: any) => e.nombre === esp.nombre)?.disponibilidad;

    this.diasDisponibles = disp ? this.generarDiasDisponibles(disp) : [];
    this.diaSeleccionado = '';
    this.horariosDisponibles = [];
    this.horariosReservados.clear();

    this.step = 3;                                  // → días
  }

  /* ---------- generación de días disponibles ------------- */
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

  /* ---------- selección de DÍA (Paso 3) ------------------- */
  async seleccionarDia(d: string) {
    this.diaSeleccionado = d;
    this.horarioSeleccionado = '';
    this.horariosReservados.clear();

    /* 1) genera franjas horarias */
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
        this.horariosDisponibles.push(
          `${desde.format('HH:mm')} - ${sig.format('HH:mm')}`
        );
        desde.add(30, 'minutes');
      }
    });

    /* 2) trae turnos ya reservados */
    const startDay = moment(d).startOf('day').toISOString();
    const endDay = moment(d).endOf('day').toISOString();

    const { data } = await this.sb
      .from('turnos')
      .select('fecha_hora')
      .eq('especialista_id', this.especialistaSeleccionado.uid)
      .eq('especialidad', this.especialidadSeleccionada)
      .not('estado', 'in', '("cancelado")')
      .gte('fecha_hora', startDay)
      .lte('fecha_hora', endDay);

    data?.forEach(t => {
      const hhmm = moment(t.fecha_hora).format('HH:mm');
      this.horariosReservados.add(hhmm);
    });

    this.step = 4;                                  // → horarios
  }

  seleccionarHorario(h: string) { this.horarioSeleccionado = h; }

  volverA(paso: number) {
    this.step = paso;
    if (paso < 4) this.horarioSeleccionado = '';
    if (paso < 3) {
      this.diaSeleccionado = '';
      this.horariosDisponibles = [];
      this.horariosReservados.clear();
    }
    if (paso < 2) {
      this.especialidadSeleccionada = '';
      this.especialidadesEspecialista = [];
      this.especialistaSeleccionado = null;
    }
  }

  /* ---------- confirmación de turno ----------------------- */
  async confirmarTurno() {
    const pacienteUID =
      this.tipoUsuario === 'administrador'
        ? this.pacienteSeleccionado?.id
        : this.usuario?.id;

    if (
      !this.especialistaSeleccionado ||
      !this.especialidadSeleccionada ||
      !this.diaSeleccionado ||
      !this.horarioSeleccionado ||
      !pacienteUID
    ) {
      Swal.fire('Faltan datos', 'Completa todos los campos', 'error');
      return;
    }

    /* objeto para Supabase */
    const nuevoTurno = {
      fecha_hora: new Date(
        `${this.diaSeleccionado} ${this.horarioSeleccionado.split(' - ')[0]}`
      ),
      estado: 'pendiente',
      especialidad: this.especialidadSeleccionada,
      paciente_id: pacienteUID,
      especialista_id: this.especialistaSeleccionado.uid,
      resenaEspecialista: '',
      resenaPaciente: '',
      diagnostico: '',
      historiaClinica: [],
      comentario: '',
      encuesta: [],
    };

    const { error } = await this.sb.from('turnos').insert(nuevoTurno);

    if (!error) {
      this.router.navigate(['/mis-turnos-paciente']);
    } else {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar el turno', 'error');
    }
  }

  getImagenEspecialidad(nombre: string): string {
  const key = nombre.toLowerCase();
  const mapa: Record<string, string> = {
    Enfermero:  'assets/especialidades/enfermero.webp',
    Pediatra:   'assets/especialidades/pediatra.webp',
    Cardiologo: 'assets/especialidades/cardiologo.webp',
  };
  return mapa[key] || 'assets/especialidades/default.webp';
}
}
