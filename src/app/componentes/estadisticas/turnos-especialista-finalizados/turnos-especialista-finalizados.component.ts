/* src/app/…/estadisticas/turnos-especialista-finalizados/turnos-especialista-finalizados.component.ts */
import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { Chart }   from 'chart.js';
import { jsPDF }  from 'jspdf';
import autoTable  from 'jspdf-autotable';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE }       from '../../../app.config';

@Component({
  selector   : 'app-turnos-especialista-finalizados',
  templateUrl: './turnos-especialista-finalizados.component.html',
  styleUrls  : ['./turnos-especialista-finalizados.component.css'],
  standalone : true,
})
export class TurnosEspecialistaFinalizadosComponent implements OnInit {

  @ViewChild('turnosFinalizadosChartCanvas', { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  turnos: { fecha: Date|null; especialistaNombre: string }[] = [];
  turnosPorEspecialista: Record<string, number> = {};
  especialistas: Record<string, string> = {};       // cache id→nombre
  fechaInicio: Date | null = null;
  fechaFin   : Date | null = null;
  chart      : Chart | null = null;

  /* ---------- Supabase ---------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  async ngOnInit() { await this.cargarTurnos(); }

  /* ------------------------------------------------------------------
   * Lee turnos "realizado" y resuelve nombre del especialista
   * ------------------------------------------------------------------ */
  private async cargarTurnos() {

    const { data, error } = await this.sb
      .from('turnos')
      .select('fecha_hora, estado, especialista_id')
      .eq('estado', 'realizado');               // sólo finalizados

    if (error) { console.error(error); return; }

    this.turnos = [];
    for (const row of data ?? []) {

      /* ── fecha ─────────────────────────────────────── */
      const fecha = row.fecha_hora ? new Date(row.fecha_hora as string) : null;

      /* ── nombre especialista con cache ─────────────── */
      const espId = row.especialista_id as string | null;
      let espNombre = 'Desconocido';

      if (espId) {
        if (!this.especialistas[espId]) {
          const { data: u } = await this.sb
            .from('usuarios')
            .select('nombre')
            .eq('id', espId)
            .single();
          espNombre = u?.nombre ?? 'Desconocido';
          this.especialistas[espId] = espNombre;
        } else {
          espNombre = this.especialistas[espId];
        }
      }

      this.turnos.push({ fecha, especialistaNombre: espNombre });
    }

    this.aplicarFiltro();        // calcula estadística + grafica
  }

  /* -------------------- filtro rango fechas -------------------- */
  aplicarFiltro() {
    this.turnosPorEspecialista = {};

    const filtrados = this.turnos.filter(t => {
      return (!this.fechaInicio || (t.fecha && t.fecha >= this.fechaInicio)) &&
             (!this.fechaFin    || (t.fecha && t.fecha <= this.fechaFin));
    });

    filtrados.forEach(t => {
      const key = t.especialistaNombre;
      this.turnosPorEspecialista[key] = (this.turnosPorEspecialista[key] || 0) + 1;
    });

    this.renderChart();
  }

  onFechaInicioChange(e: Event) { this.fechaInicio = (e.target as HTMLInputElement).valueAsDate; this.aplicarFiltro(); }
  onFechaFinChange   (e: Event) { this.fechaFin    = (e.target as HTMLInputElement).valueAsDate; this.aplicarFiltro(); }

  /* -------------------- Chart.js -------------------- */
  private renderChart() {
    const labels = Object.keys(this.turnosPorEspecialista);
    const values = Object.values(this.turnosPorEspecialista);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type : 'bar',
      data : {
        labels,
        datasets: [{
          label : 'Turnos Finalizados por Especialista',
          data  : values,
          backgroundColor: '#4c5baf',
          borderColor    : '#34568b',
          borderWidth    : 1,
          hoverBackgroundColor: '#274b72',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title : {
            display: true,
            text   : 'Turnos Finalizados por Especialista',
            font   : { size: 20 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Especialistas', font: { size: 16 } },
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

  /* -------------------- PDF -------------------- */
  descargarPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });

    doc.setFont('helvetica', 'bold').setFontSize(18);
    doc.text('Estadísticas: Turnos Finalizados por Especialista', 10, 30);

    const labels = this.chart?.data.labels as string[];
    const values = this.chart?.data.datasets[0].data as number[];

    autoTable(doc, {
      startY: 50,
      head : [['Especialista', 'Cantidad']],
      body : labels.map((l,i) => [l, values[i].toString()]),
      styles     : { fontSize: 12 },
      headStyles : { fillColor: [76,175,80], textColor: 255 },
      bodyStyles : { textColor: 50 },
    });

    const y = (doc as any).lastAutoTable.finalY || 70;
    const img = this.chartCanvas.nativeElement.toDataURL('image/png');
    doc.addImage(img, 'PNG', 15, y + 10, 500, 250);

    doc.save('turnos-finalizados.pdf');
  }
}
