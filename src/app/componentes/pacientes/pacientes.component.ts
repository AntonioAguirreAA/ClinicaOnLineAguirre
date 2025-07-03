/* -----------------------------------------------------------------
 * PacientesComponent · lista pacientes atendidos y muestra turnos
 *   – Al pulsar “Reseña”, levanta un Swal con la reseña real
 * ----------------------------------------------------------------- */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

import { Usuario } from '../../clases/usuario';
import { AuthService } from '../../servicios/auth.service';
import { CapitalizarPipe } from '../../pipes/capitalizar-pipe.pipe';

import { SUPABASE } from '../../app.config';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  imports: [CommonModule, CapitalizarPipe],
})
export class PacientesComponent implements OnInit {
  pacientes: (Usuario & {
    turnos: { id: string; fecha: Date }[];
  })[] = [];

  pacienteSeleccionado: Usuario | null = null;
  especialistaId = '';

  /* -------- Supabase -------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  constructor(private authService: AuthService) {}

  /* ---------------- lifecycle ---------------- */
  async ngOnInit() {
    const usuario = await this.authService.getUserProfile();
    if (!usuario) return;

    this.especialistaId = usuario.id;
    this.pacientes      = await this.obtenerPacientesAtendidos(this.especialistaId);
  }

  /* ------------- despliega / oculta ------------- */
  seleccionarPaciente(p: Usuario) {
    this.pacienteSeleccionado =
      this.pacienteSeleccionado?.id === p.id ? null : p;
  }

  /* ------------- RESEÑA ------------------------- */
  async verResena(turnoId: string) {
    const { data, error } = await this.sb
      .from('turnos')
      .select('resenaPaciente, "resenaEspecialista", calif_paciente')
      .eq('id', turnoId)
      .single();

    if (error || !data) {
      Swal.fire('Sin reseña', 'No se encontró reseña para este turno.', 'info');
      return;
    }

    const html =
      
      (data.resenaEspecialista
        ? `<p><strong>Reseña del especialista:</strong><br>${data.resenaEspecialista}</p>`
        : '');

    Swal.fire({
      title: 'Reseña de la consulta',
      html: html || 'No hay reseña disponible para este turno.',
      icon: 'info',
      confirmButtonText: 'Cerrar',
    });
  }

  /* ----------- pacientes atendidos --------------- */
private async obtenerPacientesAtendidos(espId: string) {
  /* 1) turnos FINALIZADOS del especialista logueado */
  const { data: turnos } = await this.sb
    .from('turnos')
    .select('id, paciente_id, fecha_hora')
    .eq('especialista_id', espId)
    .eq('estado', 'realizado');          // ← solo “finalizados”

  if (!turnos?.length) return [];

  /* 2) agrupar por paciente */
  const mapa = new Map<string, { turnos: { id: string; fecha: Date }[] }>();

  turnos.forEach(t => {
    const pid   = t.paciente_id;
    const fecha = new Date(t.fecha_hora);

    if (!mapa.has(pid)) mapa.set(pid, { turnos: [] });
    mapa.get(pid)!.turnos.push({ id: t.id, fecha });
  });

  /* 3) traer datos de cada paciente */
  const pacientes: any[] = [];
  for (const [pid, info] of mapa) {
    const { data: p } = await this.sb
      .from('usuarios')
      .select('id, nombre, apellido, img_url_1')
      .eq('id', pid)
      .single();
    if (!p) continue;

    pacientes.push({
      id:       p.id,
      nombre:   p.nombre,
      apellido: p.apellido,
      imgUrl1:  p.img_url_1,
      turnos:   info.turnos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    });
  }
  return pacientes;
}

}
