import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, inject } from '@angular/core';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../../../app.config';

import { Turno } from '../../../clases/turno';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css',
  imports: [CommonModule],
})
export class HistoriaClinicaComponent implements OnInit {

  @Input() pacienteId!: string;        // ID del paciente
  @Input() especialistaId?: string;    // (no se usa aquí, pero se conserva)
  @Input() isAdmin = false;            // idem
  historial: Turno[] = [];

  /* -------- Supabase -------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  async ngOnInit() {
    if (this.pacienteId) {
      this.historial = await this.cargarHistorial(this.pacienteId);
    }
    console.log(this.historial);
  }

  /* ------------------- carga historial ------------------- */
  private async cargarHistorial(pacienteUuid: string): Promise<Turno[]> {
    /* 1. turnos del paciente */
    const { data, error } = await this.sb
      .from('turnos')
      .select('*')
      .eq('paciente_id', pacienteUuid)
      .order('fecha_hora', { ascending: false });

    if (error) { console.error(error); return []; }

    /* 2. mapear filas a Turno */
    const turnos: Turno[] = data!.map(row => new Turno(
      row.id,
      new Date(row.fecha_hora),
      row.estado,
      row.especialidad,
      row.paciente_id,
      row.especialista_id,
      row.pacienteNombre,
      row.especialistaNombre,
      row.resenaPaciente,
      row.resenaEspecialista,
      row.comentario,
      row.diagnostico,
      row.historiaClinica,
      row.calif_paciente,
      row.encuesta
    ));

    /* 3. completar nombre del especialista si falta */
    for (const t of turnos) {
      if (!t.especialistaNombre && t.especialista) {
        const { data } = await this.sb
          .from('usuarios')
          .select('nombre')
          .eq('id', t.especialista)
          .single();
        t.especialistaNombre = data ? data.nombre : 'Desconocido';
      }
    }
    return turnos;
  }
}
