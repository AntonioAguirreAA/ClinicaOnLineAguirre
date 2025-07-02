/* -----------------------------------------------------------------
 * TurnosComponent  –  adaptación mínima a Supabase
 * (mismo formato y flujo que el código Firebase original)
 * ----------------------------------------------------------------- */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../../../servicios/auth.service';
import Swal from 'sweetalert2';
import { Turno } from '../../../clases/turno';
import { EstadoTurnoDirective } from '../../../directivas/estado-turno.directive';
import { EstadoFilaDirective } from '../../../directivas/estado-turno-fila.directive';
import { SUPABASE } from '../../../app.config';

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EstadoTurnoDirective,
    EstadoFilaDirective,
  ],
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  especialidades: string[] = [];
  especialistas: string[] = [];
  filtro: string = '';
  usuario: any;

  /* -------- cambio: usamos Supabase en vez de Firestore -------- */
  private supabase = inject<SupabaseClient>(SUPABASE);
  constructor(private authService: AuthService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'administrador') {
      return;
    }
    await this.cargarTurnos();
  }

  /* -------------------- carga inicial (Supabase) -------------------- */
  async cargarTurnos() {
    const { data, error } = await this.supabase          // ← consulta única
      .from('turnos')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    /* mapeo igual que antes, usando la clase Turno */
    const turnos: Turno[] = (data ?? []).map((row: any) => {
      return new Turno(
        row.id,
        row.fecha_hora ? new Date(row.fecha_hora) : new Date(),
        row.estado,
        row.especialidad,
        row.paciente_id,
        row.especialista_id,
        row.pacienteNombre,
        row.especialistaNombre,
        row.resenaPaciente,
        row.resenaEspecialista,
        row.comentario,
        row.diagnostico
      );
    });

    /* completar nombres (siguiendo el mismo patrón paso-a-paso) */
    for (let turno of turnos) {
      if (turno.especialista) {
        const { data: esp } = await this.supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', turno.especialista)
          .single();
        turno.especialistaNombre = esp ? esp.nombre : 'Desconocido';
      }
      if (turno.paciente) {
        const { data: pac } = await this.supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', turno.paciente)
          .single();
        turno.pacienteNombre = pac ? pac.nombre : 'Desconocido';
      }
    }

    this.turnos = turnos;
    this.turnosFiltrados = [...this.turnos];

    /* filtros únicos — mismo formato que original */
    this.especialidades = Array.from(
      new Set(this.turnos.map(turno => turno.especialidad ?? ''))
    ).filter(Boolean) as string[];

    this.especialistas = Array.from(
      new Set(this.turnos.map(turno => turno.especialistaNombre ?? ''))
    ).filter(Boolean) as string[];
  }

  /* -------------------- filtro global -------------------- */
  aplicarFiltro() {
    const filtroLower = this.filtro.toLowerCase();
    this.turnosFiltrados = this.turnos.filter(turno =>
      (turno.especialidad?.toLowerCase().includes(filtroLower) ||
       turno.especialistaNombre?.toLowerCase().includes(filtroLower) ||
       turno.pacienteNombre?.toLowerCase().includes(filtroLower) ||
       turno.estado?.toLowerCase().includes(filtroLower))
    );
  }

  /* -------------------- cancelar turno ------------------- */
  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true,
    });

    if (comentario) {
      try {
        /* cambio: update con Supabase */
        const { error } = await this.supabase
          .from('turnos')
          .update({ estado: 'cancelado', comentario })
          .eq('id', turno.id);

        if (!error) {
          Swal.fire('Turno cancelado', 'El turno ha sido cancelado exitosamente.', 'success');
          await this.cargarTurnos();
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Error al cancelar el turno:', error);
        Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
      }
    }
  }
}
