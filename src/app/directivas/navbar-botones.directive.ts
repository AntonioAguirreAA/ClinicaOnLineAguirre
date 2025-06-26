import { Directive, ElementRef, Renderer2, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appNavbarBotones]',
  standalone: true,
})
export class NavbarBotonesDirective {
  @Input() hoverBackgroundColor: string = '#007bff'; // Color de fondo al hacer hover
  @Input() hoverTextColor: string = '#ffffff'; // Color de texto al hacer hover

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    // Aplica estilos solo si el enlace no está activo
    if (!this.el.nativeElement.classList.contains('active')) {
      this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.hoverBackgroundColor);
      this.renderer.setStyle(this.el.nativeElement, 'color', this.hoverTextColor);
      this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    // Restaura estilos originales si el enlace no está activo
    if (!this.el.nativeElement.classList.contains('active')) {
      this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', '');
      this.renderer.setStyle(this.el.nativeElement, 'color', '');
    }
  }

  @HostListener('click') onClick() {
    // Limpia el estado activo de otros enlaces
    const allLinks = this.el.nativeElement.parentElement.parentElement.querySelectorAll('a');
    allLinks.forEach((link: HTMLElement) => {
      if (link !== this.el.nativeElement) {
        this.renderer.setStyle(link, 'backgroundColor', '');
        this.renderer.setStyle(link, 'color', '');
      }
    });

    // Aplica estilos al enlace actualmente activo
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.hoverBackgroundColor);
    this.renderer.setStyle(this.el.nativeElement, 'color', this.hoverTextColor);
  }
}
