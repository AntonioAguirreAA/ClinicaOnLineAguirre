import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightUserType]',
  standalone: true
})
export class HighlightUserTypeDirective implements OnChanges {
  @Input() appHighlightUserType: string = ''; // El tipo de usuario

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    this.applyColor();
  }

  private applyColor(): void {
    let color = '';

    // Asigna un color según el tipo de usuario
    switch (this.appHighlightUserType) {
      case 'paciente':
        color = 'lightblue';
        break;
      case 'especialista':
        color = 'lightgreen';
        break;
      case 'administrador':
        color = 'lightcoral';
        break;
      default:
        color = 'white';
    }

    // Aplica el color al fondo de la card
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
  }
}
