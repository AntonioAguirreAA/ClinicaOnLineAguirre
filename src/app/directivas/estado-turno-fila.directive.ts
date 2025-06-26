import { Directive, ElementRef, Input, Renderer2, OnChanges } from '@angular/core';

@Directive({
  selector: '[appEstadoFila]',
  standalone: true
})
export class EstadoFilaDirective implements OnChanges {
  @Input() appEstadoFila: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    this.applyRowStyle();
  }

  private applyRowStyle(): void {
    let backgroundColor = '';
    let color = '';

    switch (this.appEstadoFila.toLowerCase()) {
      case 'pendiente':
        backgroundColor = '#fff3cd'; // Amarillo claro
        color = '#856404'; // Amarillo oscuro
        break;
      case 'aceptado':
        backgroundColor = '#d4edda'; // Verde claro
        color = '#155724'; // Verde oscuro
        break;
      case 'realizado':
        backgroundColor = '#cce5ff'; // Azul claro
        color = '#004085'; // Azul oscuro
        break;
      case 'rechazado':
      case 'cancelado':
        backgroundColor = '#f8d7da'; // Rojo claro
        color = '#721c24'; // Rojo oscuro
        break;
      default:
        backgroundColor = '#e2e3e5'; // Gris claro
        color = '#6c757d'; // Gris oscuro
    }

    // Aplica los estilos a la fila completa
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', backgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
  }
}
