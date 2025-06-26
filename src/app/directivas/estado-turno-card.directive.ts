import { Directive, ElementRef, Input, Renderer2, OnChanges } from '@angular/core';

@Directive({
  selector: '[appEstadoCard]',
  standalone: true  
})
export class EstadoTurnoCardDirective implements OnChanges {
  @Input() appEstadoCard: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    this.applyCardStyle();
  }

  private applyCardStyle(): void {
    let backgroundColor = '';
    let color = '';

    switch (this.appEstadoCard.toLowerCase()) {
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

    // Aplica los estilos al contenedor de la card
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', backgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '10px');
    this.renderer.setStyle(this.el.nativeElement, 'borderRadius', '8px');
    this.renderer.setStyle(this.el.nativeElement, 'marginBottom', '15px');
    this.renderer.setStyle(this.el.nativeElement, 'boxShadow', '0 4px 6px rgba(0, 0, 0, 0.1)');
  }
}
