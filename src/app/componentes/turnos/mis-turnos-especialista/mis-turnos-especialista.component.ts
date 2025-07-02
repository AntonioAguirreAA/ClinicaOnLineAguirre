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
    row.resenaEspecialista,          // ✅ nombre alineado
        row.comentario,
        row.diagnostico,
        row.historiaClinica,
    row.calif_paciente,              // ✅ sexto arg. añadido
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

    const { value: formValues } = await Swal.fire({
      title: 'Finalizar Turno',
      html: `
            <div class="custom-html-container">
            <div class="form-row">
                <label>Altura (cm):</label>
                <input id="altura" type="number" class="swal2-input" placeholder="Altura en cm">
            </div>

            <div class="form-row">
                <label>Peso (kg):</label>
                <input id="peso" type="number" class="swal2-input" placeholder="Peso en kg">
            </div>

            <div class="form-row">
                <label>Temperatura (°C):</label>
                <input id="temperatura" type="number" class="swal2-input" placeholder="Temperatura en °C">
            </div>

            <div class="form-row">
                <label>Presión (mmHg):</label>
                <input id="presion" type="text" class="swal2-input" placeholder="Presión arterial (ej. 120/80)">
            </div>

            <h5>Datos Dinámicos con Controles Específicos</h5>

            <div class="form-row">
            <label>Clave (rango):</label>
            <input id="clave1" type="text" class="swal2-input" placeholder="Clave">
            <div class="range-container">
              <input 
                id="rango" 
                type="range" 
                min="0" 
                max="100" 
                class="range-input" 
                oninput="document.getElementById('rangoValue').textContent = this.value">
              <div class="range-value">
                <span id="rangoValue">50</span>
              </div>
            </div>
          </div>

            <div class="form-row">
                <label>Clave (número):</label>
                <input id="clave2" type="text" class="swal2-input" placeholder="Clave">
                <input id="numero" type="number" class="swal2-input" placeholder="Número">
            </div>

            <div class="form-row">
              <label>Clave (Sí/No):</label>
              <input id="clave3" type="text" class="swal2-input" placeholder="Clave">
              <div class="switch-container">
                <input id="switch" type="checkbox" class="switch-input">
                <label for="switch" class="switch-label">
                  <span class="switch-indicator"></span>
                </label>
              </div>
            </div>

            <h5>Otros Datos Dinámicos</h5>
            ${Array.from({ length: 3 })
              .map(
                (_, i) => `
                <div class="form-row">
                    <label>Clave ${i + 4}:</label>
                    <input id="clave${i + 4}" type="text" class="swal2-input" placeholder="Clave">
                </div>
                <div class="form-row">
                    <label>Valor ${i + 4}:</label>
                    <input id="valor${i + 4}" type="text" class="swal2-input" placeholder="Valor">
                </div>
                `
              )
              .join('')}

            <h5>Diagnóstico y Reseña</h5>

            <div class="form-row">
                <label>Diagnóstico:</label>
                <textarea id="diagnostico" class="swal2-textarea" placeholder="Escribe el diagnóstico aquí..."></textarea>
            </div>

            <div class="form-row">
                <label>Reseña Especialista:</label>
                <textarea id="resena" class="swal2-textarea" placeholder="Escribe la reseña del turno aquí..."></textarea>
            </div>
          </div>
        `,
      focusConfirm: false,
            showCancelButton: true,
            customClass: {
                popup: 'custom-popup',
                title: 'custom-title',
                confirmButton: 'custom-confirm-button',
                cancelButton: 'custom-cancel-button',
                htmlContainer: 'custom-html-container',
            },
            buttonsStyling: false,
            didOpen: () => {
              // Recuperar los elementos asegurando sus tipos
              const switchInput = document.getElementById('switch') as HTMLInputElement | null;
              const switchText = document.querySelector('.switch-text') as HTMLElement | null;
            
              // Verificar si los elementos existen antes de agregar eventos
              if (switchInput && switchText) {
                switchInput.addEventListener('change', () => {
                  switchText.textContent = switchInput.checked ? 'Sí' : 'No';
                });
              }
            },
            preConfirm: () => {
                const altura = (document.getElementById('altura') as HTMLInputElement)?.value;
                const peso = (document.getElementById('peso') as HTMLInputElement)?.value;
                const temperatura = (document.getElementById('temperatura') as HTMLInputElement)?.value;
                const presion = (document.getElementById('presion') as HTMLInputElement)?.value;
                const diagnostico = (document.getElementById('diagnostico') as HTMLTextAreaElement)?.value;
                const resenaEspecialista = (document.getElementById('resena') as HTMLTextAreaElement)?.value;

                const rango = (document.getElementById('rango') as HTMLInputElement)?.value;
                const numero = (document.getElementById('numero') as HTMLInputElement)?.value;
                const switchValue = (document.getElementById('switch') as HTMLInputElement)?.checked ? 'Sí' : 'No';

                const datosDinamicos = [
                    { clave: (document.getElementById('clave1') as HTMLInputElement)?.value, valor: rango },
                    { clave: (document.getElementById('clave2') as HTMLInputElement)?.value, valor: numero },
                    { clave: (document.getElementById('clave3') as HTMLInputElement)?.value, valor: switchValue },
                    ...Array.from({ length: 3 })
                        .map((_, i) => {
                            const clave = (document.getElementById(`clave${i + 4}`) as HTMLInputElement)?.value;
                            const valor = (document.getElementById(`valor${i + 4}`) as HTMLInputElement)?.value;
                            return clave && valor ? { clave, valor } : null;
                        })
                        .filter((dato) => dato !== null),
                ];

                if (!altura || !peso || !temperatura || !presion || !diagnostico || !resenaEspecialista) {
                    Swal.showValidationMessage('Todos los campos principales son obligatorios');
                    return null;
                }

                return {
                    historiaClinica: [
                        {
                            altura: Number(altura),
                            peso: Number(peso),
                            temperatura: Number(temperatura),
                            presion,
                            datosDinamicos,
                        },
                    ],
                    diagnostico,
                    resenaEspecialista,
                };
            },
    });

    if (formValues) {
      const { historiaClinica, diagnostico, resenaEspecialista } = formValues;

      const { error } = await this.supabase
        .from('turnos')
        .update({
          estado: 'realizado',
          historiaClinica,
          diagnostico,
          resenaEspecialista,
        })
        .eq('id', turno.id);

      if (!error) {
        Swal.fire('Turno finalizado', 'El turno ha sido finalizado.', 'success');
        await this.cargarTurnos();
      } else {
        console.error(error);
        Swal.fire('Error', 'Hubo un problema al finalizar el turno.', 'error');
      }
    }
  }
}
