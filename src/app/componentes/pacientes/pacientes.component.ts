import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseClient } from '@supabase/supabase-js';

import { Usuario } from '../../clases/usuario';
import { AuthService } from '../../servicios/auth.service';
import { HistoriaClinicaComponent } from '../turnos/historia-clinica/historia-clinica.component';
import { CapitalizarPipe } from '../../pipes/capitalizar-pipe.pipe';

import { SUPABASE } from '../../app.config';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, HistoriaClinicaComponent, CapitalizarPipe],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
})
export class PacientesComponent implements OnInit {
  pacientes: Usuario[] = [];
  usuario: any;
  especialistaId = '';
  pacienteSeleccionado: Usuario | null = null;

  /* -------- Supabase -------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  constructor(private authService: AuthService) {}

  /* ---------------- lifecycle ---------------- */
  async ngOnInit() {
    try {
      this.usuario        = await this.authService.getUserProfile();
      this.especialistaId = this.usuario.id;                             // 👈

      this.pacientes = await this.obtenerPacientesAtendidos(this.especialistaId);
    } catch (e) {
      console.error('Error al cargar los pacientes:', e);
    }
  }

  /* ------------- toggle Historia Clínica ------------- */
  mostrarHistoriaClinica(u: Usuario) {
    this.pacienteSeleccionado =
      this.pacienteSeleccionado?.id === u.id ? null : u;
  }

  /* ------------- carga pacientes atendidos ------------ */
  private async obtenerPacientesAtendidos(espId: string): Promise<Usuario[]> {
    /* 1. traer TODOS los turnos del especialista */
    const { data: turnos, error } = await this.sb
      .from('turnos')
      .select('paciente_id, fecha_hora, comentario')         // se toman los campos que necesitamos
      .eq('especialista_id', espId)
      .order('fecha_hora', { ascending: true });

    if (error || !turnos) { console.error(error); return []; }

    /* 2. agrupar por paciente */
    const mapa = new Map<string, { turnos: { fecha: Date; detalle: string }[] }>();

    turnos.forEach(t => {
      const pid  = t.paciente_id;
      const fecha = new Date(t.fecha_hora);
      const det   = t.comentario ?? '';

      if (!mapa.has(pid)) mapa.set(pid, { turnos: [] });
      mapa.get(pid)!.turnos.push({ fecha, detalle: det });
    });

    /* 3. traer datos de cada paciente */
    const pacientes: Usuario[] = [];
    for (const [pid, info] of mapa) {
      const { data: p, error } = await this.sb
        .from('usuarios')
        .select('id, nombre, apellido, edad, dni, email, img_url_1, img_url_2, tipo_usuario, obra_social, aprobado, especialidades')
        .eq('id', pid)
        .single();

      if (error || !p) continue;

      const paciente: Usuario = {
        id:            p.id,
        nombre:        p.nombre,
        apellido:      p.apellido,
        edad:          p.edad,
        dni:           p.dni,
        email:         p.email,
        imgUrl1:       p.img_url_1,
        imgUrl2:       p.img_url_2,
        tipoUsuario:   p.tipo_usuario,
        obraSocial:    p.obra_social,
        aprobado:      p.aprobado,
        especialidades:p.especialidades ?? [],
        /* campo auxiliar para la UI */
        ultimosTurnos: info.turnos.slice(-3).reverse()
      } as any;                              // “as any” si la interface no contempla ultimosTurnos

      pacientes.push(paciente);
    }

    return pacientes;
  }
}
