/* src/app/.../logs/logs.component.ts */
import { CommonModule }   from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx-js-style';

import { SUPABASE } from '../../../app.config';   // token con tu instancia

@Component({
  selector   : 'app-logs',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls  : ['./logs.component.css'],
})
export class LogsComponent implements OnInit {

  logs: {
    id   : string;
    email: string;
    fecha: Date | null;
  }[] = [];

  loading = false;

  /* -------- Supabase -------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  /* ---------------- lifecycle ----------------- */
  async ngOnInit(): Promise<void> {
    await this.cargarLogs();
  }

  /* ---------------- cargar logs ---------------- */
  async cargarLogs(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      const { data, error } = await this.sb
        .from('logins')                     // tabla logins
        .select('id, email, fecha')         // solo los campos que usamos
        .order('fecha', { ascending: false });

      if (error) throw error;

      /* mapeo → objeto listo para el template */
      this.logs = (data ?? []).map(row => ({
        id   : row.id,
        email: row.email,
        fecha: row.fecha ? new Date(row.fecha) : null   // Date listo para el pipe
      }));

    } catch (e) {
      console.error('Error al cargar los logs:', e);
    } finally {
      this.loading = false;
    }
  }

descargarExcel(): void {

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.logs);

  const headerStyle: XLSX.CellStyle = {
    fill : { fgColor: { rgb: '1F4E78' } },   // azul
    font : { color: { rgb: 'FFFFFF' }, bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top   : { style: 'thin', color: { rgb: 'FFFFFF' } },
      left  : { style: 'thin', color: { rgb: 'FFFFFF' } },
      right : { style: 'thin', color: { rgb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
    },
  };

  ['A1', 'B1', 'C1'].forEach(addr => {
    if (ws[addr]) ws[addr].s = headerStyle;
  });

  ws['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
  ];

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logs');

  XLSX.writeFile(wb, 'logs.xlsx');
}

}
