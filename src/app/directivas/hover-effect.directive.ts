import { Directive, ElementRef, Renderer2, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHoverEffect]',
  standalone: true
})
export class HoverEffectDirective {
  @Input() hoverColor: string = '#f0f0f0'; // Color de fondo predeterminado
  @Input() hoverTextColor: string = '#000'; // Color de texto predeterminado
  @Input() hoverTransform: string = 'scale(1.05)'; // Transformación predeterminada

  private originalBackgroundColor: string = '';
  private originalTextColor: string = '';
  private originalTransform: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    // Guardar estilos originales
    const styles = getComputedStyle(this.el.nativeElement);
    this.originalBackgroundColor = styles.backgroundColor;
    this.originalTextColor = styles.color;
    this.originalTransform = styles.transform;

    // Aplicar estilos al pasar el mouse
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.hoverColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', this.hoverTextColor);
    this.renderer.setStyle(this.el.nativeElement, 'transform', this.hoverTransform);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease'); // Transición suave
  }

  @HostListener('mouseleave') onMouseLeave() {
    // Restaurar estilos originales
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.originalBackgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', this.originalTextColor);
    this.renderer.setStyle(this.el.nativeElement, 'transform', this.originalTransform);
  }
}
