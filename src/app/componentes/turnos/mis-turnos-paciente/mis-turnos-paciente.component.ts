
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../../../servicios/auth.service';
import { Turno } from '../../../clases/turno';
import Swal from 'sweetalert2';
import { EstadoTurnoCardDirective } from '../../../directivas/estado-turno-card.directive';
import { EstadoTurnoDirective } from '../../../directivas/estado-turno.directive';
import { SUPABASE } from '../../../app.config';
import { EstadoTurnoPipe } from '../../../pipes/estado-turno.pipe'; 

@Component({
  selector: 'app-mis-turnos-paciente',
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EstadoTurnoCardDirective,
    EstadoTurnoDirective,
    EstadoTurnoPipe,
  ],
})
export class MisTurnosPacienteComponent implements OnInit {
  /* -------------------------------------------------- */
  /* propiedades                                         */
  /* -------------------------------------------------- */
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  filtroGlobal = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  pacientes: string[] = [];
  usuario: any;

  /* -------------------------------------------------- */
  /* dependencias                                        */
  /* -------------------------------------------------- */
  private supabase = inject<SupabaseClient>(SUPABASE); // usa el token global
  constructor(private authService: AuthService) {}

  /* -------------------------------------------------- */
  /* lifecycle                                           */
  /* -------------------------------------------------- */
  async ngOnInit(): Promise<void> {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'paciente') {
      return;
    }
    await this.cargarTurnos();
  }

  /* -------------------------------------------------- */
  /* carga inicial                                       */
  /* -------------------------------------------------- */
  async cargarTurnos() {
    /* --- 1. obtener turnos del paciente ------------- */
    const { data, error } = await this.supabase
      .from('turnos')
      .select('*')
      .eq('paciente_id', this.usuario.id) // ajusta si usas .id
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    /* --- 2. mapear a objeto Turno ------------------- */
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
        row.calif_paciente,                      //  antes de row.encuesta
        row.encuesta
      );
    });

    /* --- 3. traer nombre del especialista ----------- */
    for (let turno of turnos) {
      if (turno.especialista) {
        const { data: esp } = await this.supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', turno.especialista)
          .single();

        turno.especialistaNombre = esp ? esp.nombre : 'Desconocido';
      }
    }

    this.turnos = turnos;
    this.turnosFiltrados = [...this.turnos];

    /* --- 4. filtros únicos -------------------------- */
    this.especialidades = Array.from(
      new Set(this.turnos.map((t) => t.especialidad ?? ''))
    ).filter(Boolean) as string[];

    this.especialistas = Array.from(
      new Set(this.turnos.map((t) => t.especialistaNombre ?? ''))
    ).filter(Boolean) as string[];
  }

  /* -------------------------------------------------- */
  /* filtros                                             */
  /* -------------------------------------------------- */
  aplicarFiltroGlobal() {
  const filtro = this.filtroGlobal.trim().toLowerCase();

  this.turnosFiltrados = this.turnos.filter(t => {
    const clinicaTxt = JSON.stringify(t.historiaClinica ?? [])
                        .toLowerCase();

    return (
      (t.estado?.toLowerCase().includes(filtro)) ||
      (t.especialistaNombre?.toLowerCase().includes(filtro)) ||
      (t.especialidad?.toLowerCase().includes(filtro)) ||
      (t.diagnostico?.toLowerCase().includes(filtro)) ||
      (t.resenaPaciente?.toLowerCase().includes(filtro)) ||
      (t.resenaEspecialista?.toLowerCase().includes(filtro)) ||
      clinicaTxt.includes(filtro)
    );
  });
}

  /* -------------------------------------------------- */
  /* acciones de usuario                                 */
  /* -------------------------------------------------- */
  verComentario(turno: Turno) {
    Swal.fire({
      title: 'Comentario',
      text: turno.comentario || 'No hay comentarios disponibles.',
      icon: 'info',
    });
  }

  verResena(turno: Turno) {
    Swal.fire({
      title: 'Reseña',
      text: turno.resenaEspecialista || 'No hay reseña disponibles.',
      icon: 'info',
    });
  }

  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelacion...',
      showCancelButton: true,
    });

    if (comentario) {
      const motivoCancelacion = `Motivo cancelacion: ${comentario}`;
      const { error } = await this.supabase
        .from('turnos')
        .update({ estado: 'cancelado', comentario: motivoCancelacion })
        .eq('id', turno.id);

      if (!error) {
        Swal.fire(
          'Turno cancelado',
          'El turno ha sido cancelado exitosamente.',
          'success'
        );
        await this.cargarTurnos();
      } else {
        console.error(error);
        Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
      }
    }
  }

  async verDiagnostico(turno: Turno) {
    if (turno.estado !== 'realizado') {
      Swal.fire(
        'Diagnóstico no disponible',
        'El turno no tiene diagnóstico o no ha sido realizado.',
        'warning'
      );
      return;
    }

    const { data, error } = await this.supabase
      .from('turnos')
      .select('diagnostico')
      .eq('id', turno.id)
      .single();

    if (error) {
      console.error(error);
      Swal.fire(
        'Error',
        'Hubo un problema al obtener el diagnóstico del turno.',
        'error'
      );
      return;
    }

    Swal.fire({
      title: 'Diagnóstico del Turno',
      text: data?.diagnostico || 'No hay diagnóstico disponible.',
      icon: 'info',
    });
  }

  /* ---------- calificar atención (comentario + 1-5) ---------- */
  async calificarAtencion(turno: Turno) {
    if (turno.estado !== 'realizado' || turno.resenaPaciente) return;   // ⬅️

    const { value: form } = await Swal.fire({
      title: 'Calificar Atención',
      html: `
        <label>Calificación (1-5):</label>
        <select id="rating" class="swal2-select">
          <option value="">--</option>
          <option *ngFor="let n of [1,2,3,4,5]" [value]="n">{{n}}</option>
        </select>
        <label>Reseña:</label>
        <textarea id="review" class="swal2-textarea"
          placeholder="Escribe tu reseña…"></textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const rating = (document.getElementById('rating') as HTMLSelectElement).value;
        const review = (document.getElementById('review')  as HTMLTextAreaElement).value.trim();
        if (!rating || !review) {
          Swal.showValidationMessage('Calificación y reseña son obligatorias');
          return null;
        }
        return { rating: Number(rating), review };
      }
    });

    if (!form) return;

    const { error } = await this.supabase
      .from('turnos')
      .update({
        resenaPaciente: form.review,
        calif_paciente: form.rating
      })
      .eq('id', turno.id);

    if (!error) {
      Swal.fire('¡Gracias!', 'Tu calificación fue registrada', 'success');
      await this.cargarTurnos();    // ← recarga lista y oculta botón
    } else {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar tu reseña', 'error');
    }
  }

  async completarEncuesta(turno: Turno) {
    if (!(turno.estado === 'realizado' && turno.diagnostico.length > 0)) {
      Swal.fire(
        'Acción no permitida',
        'El turno no cumple con los requisitos para completar la encuesta.',
        'warning'
      );
      return;
    }

    const { value: respuestas } = await Swal.fire({
      title: 'Completar Encuesta',
      html: `
        <label>¿Cómo calificarías la atención?</label>
        <select id="atencion" class="swal2-select">
          <option value="1">1</option><option value="2">2</option>
          <option value="3">3</option><option value="4">4</option>
          <option value="5">5</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const atencion = (document.getElementById('atencion') as HTMLSelectElement).value;
        if (!atencion) {
          Swal.showValidationMessage('Debes completar la pregunta');
          return null;
        }
        return [
          { pregunta: '¿Cómo calificarías la atención?', respuesta: atencion }
        ];
      },
    });

    if (respuestas) {
      const { error } = await this.supabase
        .from('turnos')
        .update({ encuesta: respuestas })
        .eq('id', turno.id);

      if (!error) {
        Swal.fire(
          'Encuesta enviada',
          'Gracias por completar la encuesta.',
          'success'
        );
        await this.cargarTurnos();
      } else {
        console.error(error);
        Swal.fire('Error', 'Hubo un problema al enviar la encuesta.', 'error');
      }
    }
  }
}
