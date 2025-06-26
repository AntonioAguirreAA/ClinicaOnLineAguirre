import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'especialistaNombre',
  standalone: true
})
export class NombreEspecialistaPipe implements PipeTransform {
  transform(nombre: string, apellido: string, tipoUsuario: string): string {
    if (tipoUsuario === 'especialista') {
      return `Dr./Dra. ${nombre} ${apellido}`;
    }
    return `${nombre} ${apellido}`; 
  }
}
