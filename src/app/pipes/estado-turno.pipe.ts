import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoTurno',
  standalone: true
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
