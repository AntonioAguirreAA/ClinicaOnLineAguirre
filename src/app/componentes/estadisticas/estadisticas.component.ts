/* src/app/…/estadisticas/estadisticas.component.ts */
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { LogsComponent }                         from './logs/logs.component';
import { TurnosEspecialidadComponent }           from './turnos-especialidad/turnos-especialidad.component';
import { TurnosDiaComponent }                    from './turnos-dia/turnos-dia.component';
import { TurnosEspecialistaComponent }           from './turnos-especialista/turnos-especialista.component';
import { TurnosEspecialistaFinalizadosComponent } from './turnos-especialista-finalizados/turnos-especialista-finalizados.component';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE }       from '../../app.config';

@Component({
  selector   : 'app-estadisticas',
  standalone : true,
  templateUrl: './estadisticas.component.html',
  styleUrls  : ['./estadisticas.component.css'],
  imports    : [
    CommonModule,
    LogsComponent,
    TurnosEspecialidadComponent,
    TurnosDiaComponent,
    TurnosEspecialistaComponent,
    TurnosEspecialistaFinalizadosComponent
  ]
})
export class EstadisticasComponent implements OnInit {

  /* ── si más adelante necesitas consultas globales ── */
  // private sb = inject<SupabaseClient>(SUPABASE);

  ngOnInit(): void {
    /* Actualmente no hay carga inicial; 
       aquí podrías invocar métodos si lo requieres */
  }
}
