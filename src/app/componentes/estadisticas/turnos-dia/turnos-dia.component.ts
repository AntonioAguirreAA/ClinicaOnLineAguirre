/* src/app/…/estadisticas/turnos-dia/turnos-dia.component.ts */
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }            from '@angular/common';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, Title, CategoryScale
} from 'chart.js';
import * as XLSX from 'xlsx';
import moment    from 'moment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE }       from '../../../app.config';

@Component({
  selector   : 'app-turnos-dia',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './turnos-dia.component.html',
  styleUrls  : ['./turnos-dia.component.css'],
})
export class TurnosDiaComponent implements OnInit {

  turnos: { fecha: string }[] = [];
  turnosPorDia: Record<string, number> = {};

  fechaInicio: Date | null = null;
  fechaFin   : Date | null = null;

  chart : Chart | null = null;
  loading = false;

  /* ------------ Supabase ------------ */
  private sb = inject<SupabaseClient>(SUPABASE);

  constructor() {
    /* registrar módulos de Chart.js */
    Chart.register(LineController, LineElement, PointElement,
                   LinearScale, Title, CategoryScale);
  }

  ngOnInit(): void { this.cargarTurnos(); }

  /* ----------- carga de turnos ------------ */
  async cargarTurnos(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      /* sólo necesitamos la fecha */
      const { data, error } = await this.sb
        .from('turnos')
        .select('fecha_hora')
        .order('fecha_hora', { ascending: false });

      if (error) throw error;

      /* normalizamos a ISO-date “YYYY-MM-DD” */
      this.turnos = (data ?? []).map(row => {
        const iso = row.fecha_hora as string | null;
        return { fecha: iso ? iso.split('T')[0] : 'Fecha inválida' };
      });

      this.calcularTurnosPorDia(this.turnos);
      this.renderChart();

    } catch (e) {
      console.error('Error al cargar los turnos:', e);
    } finally {
      this.loading = false;
    }
  }

  /* --------- contabiliza turnos x día -------- */
  calcularTurnosPorDia(turnos: { fecha: string }[]): void {
    this.turnosPorDia = {};
    turnos.forEach(t => {
      this.turnosPorDia[t.fecha] = (this.turnosPorDia[t.fecha] || 0) + 1;
    });
  }

  /* ---------- filtros de fechas ------------- */
  onFechaInicioChange(evt: Event): void {
    this.fechaInicio = (evt.target as HTMLInputElement).valueAsDate;
    this.aplicarFiltro();
  }
  onFechaFinChange(evt: Event): void {
    this.fechaFin = (evt.target as HTMLInputElement).valueAsDate;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.calcularTurnosPorDia(this.turnos);
    } else {
      const filtrados = this.turnos.filter(t => {
        const d = new Date(t.fecha);
        return d >= this.fechaInicio! && d <= this.fechaFin!;
      });
      this.calcularTurnosPorDia(filtrados);
    }
    this.renderChart();
  }

  /* -------------- Chart.js ------------------- */
  renderChart(): void {
    const labels = Object.keys(this.turnosPorDia);
    const values = Object.values(this.turnosPorDia);

    if (this.chart) this.chart.destroy();

    const ctx = document.getElementById('turnosDiaChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type : 'line',
      data : {
        labels,
        datasets: [{
          label           : 'Turnos por Día',
          data            : values,
          backgroundColor : 'rgba(75, 192, 192, 0.2)',
          borderColor     : 'rgba(75, 192, 192, 1)',
          borderWidth     : 2,
          fill            : true,
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Fecha' } },
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } },
        },
      },
    });
  }

  /* -------------- PDF + Excel ---------------- */
  descargarExcel(): void {
    const sheet = XLSX.utils.json_to_sheet(this.turnos);
    const wb    = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Logs');
    XLSX.writeFile(wb, 'turnos_por_dia.xlsx');
  }

  async descargarPDF(): Promise<void> {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold').setFontSize(18);
    doc.text('Estadísticas de Turnos por Día', 10, 10);

    doc.setFontSize(12).setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 10, 20);

    autoTable(doc, {
      startY: 30,
      head : [['Fecha', 'Cantidad']],
      body : Object.entries(this.turnosPorDia).map(
               ([f,c]) => [f, c.toString()]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [76,175,80], textColor: 255 },
    });

    const y = (doc as any).lastAutoTable.finalY || 30;
    const canvas = document.getElementById('turnosDiaChart') as HTMLCanvasElement;

    if (canvas) {
      const img = canvas.toDataURL('image/png');
      doc.addImage(img, 'PNG', 10, y + 10, 180, 90);
    } else {
      doc.text('El gráfico no se encontró.', 10, y + 20);
    }

    doc.text('Clinica OnLine - Antonio Aguirre', 10, y + 110);
    doc.save('estadisticas_turnos_por_dia.pdf');
  }
}
