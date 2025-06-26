import { Directive, ElementRef, Input, Renderer2, OnChanges } from '@angular/core';

@Directive({
  selector: '[appEstadoTurno]',
  standalone: true
})
export class EstadoTurnoDirective implements OnChanges {
  @Input() appEstadoTurno: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    this.applyStyle();
  }

  private applyStyle(): void {
    let color = '';
    let backgroundColor = '';
    let border = '';

    switch (this.appEstadoTurno.toLowerCase()) {
      case 'pendiente':
        color = '#000000';
        backgroundColor = '#fff3cd';
        border = '2px solid #000000';
        break;
      case 'aceptado':
        color = '#155724';
        backgroundColor = '#d4edda';
        border = '2px solid #000000';
        break;
      case 'realizado':
        color = '#004085';
        backgroundColor = '#cce5ff';
        border = '2px solid #000000';
        break;
      case 'rechazado':
      case 'cancelado':
        color = '#721c24';
        backgroundColor = '#f8d7da';
        border = '2px solid #000000';
        break;
      default:
        color = '#6c757d';
        backgroundColor = '#e2e3e5';
        border = '2px solid #000000';
    }

    // Aplica los estilos al elemento
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', backgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '5px 10px');
    this.renderer.setStyle(this.el.nativeElement, 'borderRadius', '4px');
    this.renderer.setStyle(this.el.nativeElement, 'fontWeight', 'bold');
  }
}
