import { Component, OnInit, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE } from '../../../app.config';

import { Usuario } from '../../../clases/usuario';

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MisHorariosComponent implements OnInit {
  @Input() usuario: Usuario | null = null;

  horariosForm!: FormGroup;
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  opcionesHorario: string[] = [];

  /* ---------- Supabase ---------- */
  private sb = inject<SupabaseClient>(SUPABASE);

  constructor(private fb: FormBuilder) {}

  /* ---------------- lifecycle ---------------- */
  async ngOnInit() {
    this.horariosForm = this.fb.group({ especialidades: this.fb.array([]) });

    if (this.usuario?.especialidades) {
      this.usuario.especialidades.forEach(e => this.agregarEspecialidad(e));
    }
    this.generarOpcionesHorario();

    if (this.usuario?.id) {
      const { data } = await this.sb
        .from('disponibilidad')
        .select('especialidades')
        .eq('id', this.usuario.id)
        .single();

      if (data?.especialidades) this.cargarHorariosExistentes(data.especialidades);
    }
  }

  /* ---------------- getters ----------------- */
  get especialidades(): FormArray {
    return this.horariosForm.get('especialidades') as FormArray;
  }
  getHorarios(ix: number): FormArray {
    return this.especialidades.at(ix).get('disponibilidad') as FormArray;
  }

  /* -------------- helpers ------------------- */
  generarOpcionesHorario() {
    for (let h = 8; h <= 18; h++) {
      this.opcionesHorario.push(`${h}:00`);
      if (h < 18) this.opcionesHorario.push(`${h}:30`);
    }
  }

  /* -------- agregar / quitar controles ------- */
  agregarEspecialidad(nombre = '') {
    this.especialidades.push(
      this.fb.group({
        nombre: [nombre, Validators.required],
        disponibilidad: this.fb.array([])
      })
    );
  }

  agregarHorario(ix: number) {
    this.getHorarios(ix).push(
      this.fb.group({
        dia:   ['', Validators.required],
        desde: ['', [Validators.required, this.validarIntervalo, this.validarRango]],
        hasta: ['', [Validators.required, this.validarIntervalo, this.validarRango]]
      })
    );
  }

  seleccionarDia(ix: number, dia: string) {
    const disp = this.getHorarios(ix);
    if (!disp.controls.some(h => h.get('dia')?.value === dia)) {
      this.agregarHorario(ix);
      disp.at(disp.length - 1).patchValue({ dia });
    }
  }

  eliminarHorario(i: number, j: number) { this.getHorarios(i).removeAt(j); }

  /* -------------- validaciones --------------- */
  validarIntervalo(c: any) {
    const [h, m] = c.value.split(':').map(Number);
    return m === 0 || m === 30 ? null : { invalidInterval: true };
  }
  validarRango(c: any) {
    const [h] = c.value.split(':').map(Number);
    return h < 8 || h > 18 ? { outOfRange: true } : null;
  }

  /* ----------- cargar existentes ------------- */
  cargarHorariosExistentes(esps: any[]) {
    esps.forEach((e: any) => {
      if (this.especialidades.controls.every(ctrl => ctrl.get('nombre')?.value !== e.nombre)) {
        this.agregarEspecialidad(e.nombre);
      }
      const ix = this.especialidades.controls.findIndex(ctrl => ctrl.get('nombre')?.value === e.nombre);
      e.disponibilidad.forEach((h: any) => {
        this.agregarHorario(ix);
        this.getHorarios(ix).at(this.getHorarios(ix).length - 1).patchValue(h);
      });
    });
  }

  /* --------------- guardar ------------------- */
  async guardarHorarios() {
    if (this.horariosForm.invalid || !this.usuario?.id) return;

    const data = this.horariosForm.value.especialidades.filter((e: any) => e.disponibilidad.length);

    const { error } = await this.sb
      .from('disponibilidad')
      .upsert({ id: this.usuario.id, especialidades: data });

    if (!error) {
      Swal.fire('Guardado', 'Horarios actualizados', 'success');
    } else {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  }
}
