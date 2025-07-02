/* src/app/pipes/estado-turno.pipe.ts */
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea el código de estado de un turno a texto legible.
 * Ej.: 'pendiente' → 'Pendiente'
 */
@Pipe({
  name: 'estadoTurno',
  standalone: true          // ✔ para proyectos con componentes standalone
})
export class EstadoTurnoPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    switch ((estado ?? '').toLowerCase()) {
      case 'pendiente':
        return 'Pendiente';
      case 'aceptado':
        return 'Aceptado';
      case 'realizado':
        return 'Realizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado ?? '';
    }
  }
}
