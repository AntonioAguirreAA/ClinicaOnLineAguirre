import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Usuario } from '../../clases/usuario';
import { CommonModule } from '@angular/common';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import moment from 'moment';
import 'moment/locale/es';

// DIRECTIVAS / COMPONENTES
import { MisHorariosComponent } from '../turnos/mis-horarios/mis-horarios.component';
import { HistoriaClinicaComponent } from '../turnos/historia-clinica/historia-clinica.component';

// SUPABASE
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../../app.config';

moment.locale('es');

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MisHorariosComponent,
    HistoriaClinicaComponent,
  ]
})
export class MiPerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  historial: any[] = [];
especialistas: string[] = [];
especialistaSeleccionado = '';
  logoUrl = '';
  especialidades: string[] = [];

  captchaValido = false;
  captchaHabilitado = true;

  /* ---------- Supabase ---------- */
  private sb = inject<SupabaseClient>(SUPABASE);
  constructor(private authService: AuthService) {}

  /* ------------------- lifecycle ------------------- */
  async ngOnInit() {
    try {
      this.usuario = await this.authService.getUserProfile();

      if (this.usuario?.tipoUsuario === 'paciente') {
        this.historial = await this.cargarTurnos(this.usuario.id);
        this.especialistas = [
        ...new Set(this.historial.map(t => t.especialistaNombre|| ''))
      ];
      }
    } catch (e) {
      console.error('Error al obtener perfil:', e);
    }
  }

  
  /* ---------------- cargar turnos ------------------ */
  async cargarTurnos(pacienteId: string): Promise<any[]> {
    const { data, error } = await this.sb
      .from('turnos')
      .select('*')
      .eq('paciente_id', pacienteId);

    if (error) { console.error(error); return []; }

    const turnos = data!.map(row => ({
      id: row.id,
      fecha: new Date(row.fecha_hora).toLocaleDateString(),
      ...row
    }));

    for (const t of turnos) {
  if (t.especialista_id) {
    const { data } = await this.sb
      .from('usuarios')
      .select('nombre, apellido')
      .eq('id', t.especialista_id)
      .single();

    t.especialistaNombre = data
      ? `${data.nombre} ${data.apellido}`
      : 'Desconocido';
  }
}
    return turnos;
  }

  /* ------------- generar PDF historia -------------- */
  async generarHistoriaClinicaPDF() {
  const logo = 'assets/logo.png';
  try {
    const doc = new jsPDF();
    const logo64 = await this.toBase64(logo);
    doc.addImage(logo64, 'PNG', 10, 10, 50, 30);

    doc.setFontSize(18).setFont('helvetica', 'bold')
       .text('Historia Clínica', 80, 20);

    doc.setFontSize(12).setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 10, 50);
    doc.text(`Paciente: ${this.usuario?.nombre} ${this.usuario?.apellido}`, 10, 60);
    doc.text(`DNI: ${this.usuario?.dni}`, 10, 70);
    doc.text(`Email: ${this.usuario?.email}`, 10, 80);

    /* === FILTRO POR ESPECIALISTA === */
    const historial = this.historial.filter(t =>
      ( !this.especialistaSeleccionado ||
        t.especialistaNombre === this.especialistaSeleccionado ) &&
      Array.isArray(t.historiaClinica) &&
      t.historiaClinica.length > 0
    );

    autoTable(doc, {
      startY: 90,
      head: [['Fecha', 'Especialidad', 'Especialista', 'Diagnóstico', 'Reseña']],
      body: historial.map(t => [
        t.fecha || 'N/A',
        t.especialidad || 'N/A',
        t.especialistaNombre || 'Desconocido',
        `Diagnóstico: ${t.diagnostico || 'Sin diagnóstico'}\n` +
        `Altura: ${t.historiaClinica?.[0]?.altura || 'N/A'} cm, ` +
        `Peso: ${t.historiaClinica?.[0]?.peso || 'N/A'} kg, ` +
        `Temp: ${t.historiaClinica?.[0]?.temperatura || 'N/A'} °C, ` +
        `Presión: ${t.historiaClinica?.[0]?.presion || 'N/A'}`,
        t.resenaEspecialista || 'Sin reseña',
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [255, 0, 0], textColor: 255 },
    });

    doc.save(`Historia_Clinica_${this.usuario?.nombre}_${this.usuario?.apellido}.pdf`);
  } catch (e) {
    console.error(e);
    Swal.fire('Error', 'No se pudo generar el PDF', 'error');
  }
}

  private toBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = err => reject(err);
    });
  }

  /* ------ binding select especialidad PDF ---------- */
  especialidadSeleccionada = '';
}
