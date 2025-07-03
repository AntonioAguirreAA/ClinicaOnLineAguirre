/* src/app/…/logs/logs.component.ts */
import { CommonModule }   from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX          from 'xlsx';

import { SUPABASE } from '../../../app.config';   // ← token con tu instancia

@Component({
  selector   : 'app-logs',
  standalone : true,
  imports    : [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls  : ['./logs.component.css'],
})
export class LogsComponent implements OnInit {

  logs: any[]  = [];
  loading      = false;

  /* -------- Supabase -------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  async ngOnInit(): Promise<void> {
    await this.cargarLogs();
  }

  /* ---------------- cargar logs ---------------- */
  async cargarLogs(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      /* consulta: tabla “logins”, orden descendente por fecha */
      const { data, error } = await this.sb
        .from('logins')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      this.logs = (data ?? []).map(row => ({
        ...row,
        /* si quieres formatear la fecha en el template,
           deja el Date aquí preparado:                */
        fecha: row.fecha ? new Date(row.fecha) : null
      }));

    } catch (e) {
      console.error('Error al cargar los logs:', e);
    } finally {
      this.loading = false;
    }
  }

  /* ---------------- exportar a Excel ------------- */
  descargarExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.logs);
    const workbook : XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, 'logs.xlsx');
  }
}
