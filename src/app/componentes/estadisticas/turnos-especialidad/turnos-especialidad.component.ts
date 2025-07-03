/* src/app/…/estadisticas/turnos-especialidad/turnos-especialidad.component.ts */
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Chart, BarController, BarElement, CategoryScale,
  LinearScale, Tooltip, Title
} from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE }       from '../../../app.config';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Title);

@Component({
  selector   : 'app-turnos-especialidad',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './turnos-especialidad.component.html',
  styleUrls  : ['./turnos-especialidad.component.css']
})
export class TurnosEspecialidadComponent implements OnInit {

  @ViewChild('chartCanvas', { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /* ---------- Supabase ---------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  async ngOnInit(): Promise<void> {
    const data = await this.cargarTurnosPorEspecialidad();
    this.crearGrafico(data);
  }

  /* ------------------------------------------------------------------
   * Devuelve { 'Clínica Médica': 12, 'Traumatología': 5, … }
   * ------------------------------------------------------------------ */
  private async cargarTurnosPorEspecialidad(): Promise<Record<string, number>> {
    const { data, error } = await this.sb
      .from('turnos')
      .select('especialidad');

    if (error) {
      console.error('Error al leer turnos:', error);
      return {};
    }

    const conteo: Record<string, number> = {};
    (data ?? []).forEach(row => {
      const esp = row.especialidad as string | null;
      if (esp) conteo[esp] = (conteo[esp] || 0) + 1;
    });

    return conteo;
  }

  /* ----------------- gráfico ----------------- */
  crearGrafico(data: Record<string, number>): void {
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type : 'bar',
      data : {
        labels,
        datasets: [{
          label           : 'Turnos por Especialidad',
          data            : values,
          backgroundColor : '#4c5baf',
          borderColor     : '#34568b',
          borderWidth     : 1,
          hoverBackgroundColor: '#274b72',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          title: {
            display: true,
            text: 'Turnos por Especialidad',
            font: { size: 18 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Especialidades', font: { size: 16 } },
            ticks: { font: { size: 14 } }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Cantidad de Turnos', font: { size: 16 } },
            ticks: { font: { size: 14 } }
          }
        }
      }
    });
  }

  /* ------------- exportar PDF -------------- */
  descargarPDF(): void {
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold').setFontSize(18);
    doc.text('Estadísticas: Turnos por Especialidad', 10, 10);

    const labels = this.chart?.data.labels as string[];
    const values = this.chart?.data.datasets[0].data as number[];

    autoTable(doc, {
      startY: 20,
      head : [['Especialidad', 'Cantidad']],
      body : labels.map((lbl, i) => [lbl, values[i].toString()]),
      styles     : { fontSize: 10 },
      headStyles : { fillColor: [76,175,80], textColor: 255 },
      bodyStyles : { textColor: 50 },
    });

    const y = (doc as any).lastAutoTable.finalY || 30;

    /* gráfico como imagen */
    const canvas = this.chartCanvas.nativeElement;
    const img    = canvas.toDataURL('image/png');
    doc.addImage(img, 'PNG', 10, y + 10, 180, 90);

    doc.save('turnos-especialidad.pdf');
  }
}
