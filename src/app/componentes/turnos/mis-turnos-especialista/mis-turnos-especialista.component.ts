import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../../../servicios/auth.service';
import Swal from 'sweetalert2';
import { Turno } from '../../../clases/turno';
import { EstadoTurnoCardDirective } from '../../../directivas/estado-turno-card.directive';
import { EstadoTurnoDirective } from '../../../directivas/estado-turno.directive';
import { EstadoTurnoPipe } from '../../../pipes/estado-turno.pipe';              // opcional

import { SUPABASE } from '../../../app.config';

@Component({
  selector: 'app-mis-turnos-especialista',
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EstadoTurnoCardDirective,
    EstadoTurnoDirective,
    EstadoTurnoPipe                     // si quieres usar el pipe aquí
  ],
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  especialidades: string[] = [];
  pacientes: string[] = [];
  filtroGlobal = '';
  usuario: any;

  private supabase = inject<SupabaseClient>(SUPABASE);
  constructor(private authService: AuthService) {}

  /* -------------------------------------------------- */
  /* lifecycle                                           */
  /* -------------------------------------------------- */
  async ngOnInit(): Promise<void> {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'especialista') return;
    await this.cargarTurnos();
  }

  /* -------------------------------------------------- */
  /* carga inicial                                       */
  /* -------------------------------------------------- */
  async cargarTurnos() {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('*')
      .eq('especialista_id', this.usuario.id)        // ajusta si usas .id
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

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
        row.diagnostico,
        row.historiaClinica,
    row.calif_paciente,
        row.encuesta,
      );
    });

    /* 2. nombres de pacientes */
    for (let turno of turnos) {
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

    this.especialidades = Array.from(
      new Set(this.turnos.map((t) => t.especialidad ?? ''))
    ).filter(Boolean) as string[];

    this.pacientes = Array.from(
      new Set(this.turnos.map((t) => t.pacienteNombre ?? ''))
    ).filter(Boolean) as string[];
  }

  /* -------------------------------------------------- */
  /* filtros                                             */
  /* -------------------------------------------------- */
  aplicarFiltroGlobal() {
    const filtro = this.filtroGlobal.toLowerCase();
    this.turnosFiltrados = this.turnos.filter((t) => {
      return (
        (t.estado && t.estado.toLowerCase().includes(filtro)) ||
        (t.especialidad && t.especialidad.toLowerCase().includes(filtro)) ||
        (t.pacienteNombre && t.pacienteNombre.toLowerCase().includes(filtro))
      );
    });
  }

  /* -------------------------------------------------- */
  /* helpers & acciones                                  */
  /* -------------------------------------------------- */
  verComentario(turno: Turno) {
    Swal.fire({
      title: 'Comentario',
      text: turno.comentario || 'No hay comentarios disponibles.',
      icon: 'info',
    });
  }

  cancelarTurno(turno: Turno) {
    if (['aceptado', 'realizado', 'rechazado'].includes(turno.estado)) return;

    Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Motivo de la cancelacion',
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { error } = await this.supabase
          .from('turnos')
          .update({ estado: 'cancelado', motivoCancelacion: result.value })
          .eq('id', turno.id);

        if (!error) {
          Swal.fire('Turno cancelado', 'El turno ha sido cancelado.', 'success');
          await this.cargarTurnos();
        } else {
          console.error(error);
          Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
        }
      }
    });
  }

  async rechazarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Rechazar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo del rechazo...',
      showCancelButton: true,
    });

    if (comentario) {
      const motivoRechazo = `Motivo rechazo: ${comentario}`;
      const { error } = await this.supabase
        .from('turnos')
        .update({ estado: 'cancelado', comentario: motivoRechazo })
        .eq('id', turno.id);

      if (!error) {
        Swal.fire('Turno cancelado', 'El turno ha sido rechazado.', 'success');
        await this.cargarTurnos();
      } else {
        console.error(error);
        Swal.fire('Error', 'Hubo un problema al rechazar el turno.', 'error');
      }
    }
  }

  async aceptarTurno(turno: Turno) {
    if (['realizado', 'cancelado', 'rechazado'].includes(turno.estado)) return;

    const { error } = await this.supabase
      .from('turnos')
      .update({ estado: 'aceptado' })
      .eq('id', turno.id);

    if (!error) {
      Swal.fire('Turno aceptado', 'El turno ha sido aceptado.', 'success');
      await this.cargarTurnos();
    } else {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al aceptar el turno.', 'error');
    }
  }

  async finalizarTurno(turno: Turno) {
  if (turno.estado !== 'aceptado') return;

  const { value: form } = await Swal.fire({
    title: 'Finalizar Turno',
    confirmButtonText: 'Confirmar',
    cancelButtonText:  'Cancelar',
    buttonsStyling : true,
      reverseButtons    : true,
    showCancelButton:  true,
    customClass: {
      popup:          'custom-popup',
      cancelButton:   'swal-btn-cancelar',
      confirmButton:  'swal-btn-confirmar',
    },
    html: `
      <div class="custom-html-container">

        <!-- datos “fijos” --------------------------------------------------- -->
        <div class="form-row"><label>Altura (cm):</label>
          <input id="altura" type="number" class="swal2-input" placeholder="Altura">
        </div>
        <div class="form-row"><label>Peso (kg):</label><br/>
          <input id="peso" type="number" class="swal2-input" placeholder="Peso">
        </div>
        <div class="form-row"><label>Temperatura (°C):</label>
          <input id="temperatura" type="number" class="swal2-input" placeholder="Temperatura">
        </div>
        <div class="form-row"><label>Presión (mmHg):</label>
          <input id="presion" type="text" class="swal2-input" placeholder="120/80">
        </div>

        <!-- sólo los 3 datos dinámicos ------------------------------------- -->
        <h5>Datos Dinámicos</h5>
        ${Array.from({ length: 3 })
          .map(
            (_, i) => `
              <div class="form-row">
                <label>Clave ${i+1}:</label>
                <input id="clave${i+1}" type="text" class="swal2-input" placeholder="Clave">
              </div>
              <div class="form-row">
                <label>Valor:</label>
        <input id="valor${i + 1}" type="text" class="swal2-input" placeholder="Valor">
              </div>`
          )
          .join('')}

        <!-- diagnóstico / reseña ------------------------------------------- -->
        <h5>Diagnóstico y Reseña</h5>
        <div class="form-row"><label>Diagnóstico:</label>
          <textarea id="diagnostico" class="swal2-textarea"
            placeholder="Escribe el diagnóstico aquí…"></textarea>
        </div>
        <div class="form-row"><label>Reseña Especialista:</label>
          <textarea id="resena" class="swal2-textarea"
            placeholder="Escribe la reseña…"></textarea>
        </div>
      </div>
    `,
    preConfirm: () => {
      /* --- campos principales ------------------------------------------- */
      const altura       = (document.getElementById('altura')       as HTMLInputElement).value;
      const peso         = (document.getElementById('peso')         as HTMLInputElement).value;
      const temperatura  = (document.getElementById('temperatura')  as HTMLInputElement).value;
      const presion      = (document.getElementById('presion')      as HTMLInputElement).value;
      const diagnostico  = (document.getElementById('diagnostico')  as HTMLTextAreaElement).value.trim();
      const resenaEsp    = (document.getElementById('resena')       as HTMLTextAreaElement).value.trim();

      /* --- validar ------------------------------------------------------ */
      if (!altura || !peso || !temperatura || !presion || !diagnostico || !resenaEsp) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return null;
      }

      /* --- datos dinámicos (sólo 3) ------------------------------------ */
      const datosDinamicos = Array.from({ length: 3 })
        .map((_, i) => {
          const clave = (document.getElementById(`clave${i + 1}`) as HTMLInputElement).value.trim();
          const valor = (document.getElementById(`valor${i + 1}`) as HTMLInputElement).value.trim();
          return clave && valor ? { clave, valor } : null;
        })
        .filter(Boolean);                                        // ← descarta vacíos

      return {
        historiaClinica: [{
          altura: Number(altura),
          peso: Number(peso),
          temperatura: Number(temperatura),
          presion,
          datosDinamicos,
        }],
        diagnostico,
        resenaEspecialista: resenaEsp,
      };
    },
  });

  if (!form) return;  // cancelado

  /* --- update Supabase ----------------------------------------------- */
  const { error } = await this.supabase
    .from('turnos')
    .update({
      estado:           'realizado',
      historiaClinica:  form.historiaClinica,
      diagnostico:      form.diagnostico,
      resenaEspecialista: form.resenaEspecialista,
    })
    .eq('id', turno.id);

  if (!error) {
    await Swal.fire('Turno finalizado', 'El turno se guardó correctamente', 'success');
    await this.cargarTurnos();
  } else {
    console.error(error);
    Swal.fire('Error', 'Hubo un problema al guardar los datos', 'error');
  }
}
}
