import { Directive, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { getStorage, ref, getDownloadURL } from '@angular/fire/storage';

@Directive({
  selector: '[appCaptcha]',
  standalone: true,
})
export class CaptchaDirective implements OnInit {
  @Input() disabled: boolean = false; // Permite deshabilitar el captcha
  @Output() captchaResolved = new EventEmitter<boolean>(); // Emitir evento cuando el captcha se resuelve

  private dice1Value: number = 0;
  private dice2Value: number = 0;
  private userInput: number | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    if (!this.disabled) {
      this.createCaptcha();
    }
  }

  private async createCaptcha(): Promise<void> {
    const container = this.el.nativeElement;

    // Crear contenedor principal
    this.renderer.setStyle(container, 'display', 'flex');
    this.renderer.setStyle(container, 'flexDirection', 'column');
    this.renderer.setStyle(container, 'alignItems', 'center');
    this.renderer.setStyle(container, 'gap', '15px');
    this.renderer.setStyle(container, 'marginTop', '20px');

    // Generar valores de los dados
    this.dice1Value = this.getRandomDiceValue();
    this.dice2Value = this.getRandomDiceValue();

    // Crear imágenes de los dados
    const diceContainer = this.renderer.createElement('div');
    this.renderer.setStyle(diceContainer, 'display', 'flex');
    this.renderer.setStyle(diceContainer, 'gap', '15px');

    const dice1Url = await this.getDiceImageUrl(this.dice1Value);
    const dice2Url = await this.getDiceImageUrl(this.dice2Value);

    const dice1Img = this.renderer.createElement('img');
    const dice2Img = this.renderer.createElement('img');

    this.renderer.setAttribute(dice1Img, 'src', dice1Url);
    this.renderer.setStyle(dice1Img, 'width', '80px');
    this.renderer.setStyle(dice1Img, 'height', '80px');

    this.renderer.setAttribute(dice2Img, 'src', dice2Url);
    this.renderer.setStyle(dice2Img, 'width', '80px');
    this.renderer.setStyle(dice2Img, 'height', '80px');

    this.renderer.appendChild(diceContainer, dice1Img);
    this.renderer.appendChild(diceContainer, dice2Img);
    this.renderer.appendChild(container, diceContainer);

    // Crear campo de entrada
    const input = this.renderer.createElement('input');
    this.renderer.setStyle(input, 'padding', '10px');
    this.renderer.setStyle(input, 'fontSize', '16px');
    this.renderer.setStyle(input, 'border', '1px solid #ccc');
    this.renderer.setStyle(input, 'borderRadius', '5px');
    this.renderer.setStyle(input, 'width', '200px');
    this.renderer.setAttribute(input, 'type', 'number');
    this.renderer.setAttribute(input, 'placeholder', 'Suma los dados');

    this.renderer.listen(input, 'input', (event: Event) => {
      this.userInput = +(event.target as HTMLInputElement).value;
    });

    this.renderer.appendChild(container, input);

    // Crear botón de validación
    const validateButton = this.renderer.createElement('button');
    this.renderer.setStyle(validateButton, 'padding', '10px 20px');
    this.renderer.setStyle(validateButton, 'fontSize', '16px');
    this.renderer.setStyle(validateButton, 'backgroundColor', '#4caf50');
    this.renderer.setStyle(validateButton, 'color', 'white');
    this.renderer.setStyle(validateButton, 'border', 'none');
    this.renderer.setStyle(validateButton, 'borderRadius', '5px');
    this.renderer.setStyle(validateButton, 'cursor', 'pointer');
    this.renderer.setProperty(validateButton, 'textContent', 'Validar');

    this.renderer.listen(validateButton, 'click', () => {
      this.validateCaptcha();
    });

    this.renderer.appendChild(container, validateButton);
  }

  private async getDiceImageUrl(diceValue: number): Promise<string> {
    const storage = getStorage();
    return getDownloadURL(ref(storage, `dados/${diceValue}.png`));
  }

  private getRandomDiceValue(): number {
    return Math.floor(Math.random() * 6) + 1; 
  }

  private validateCaptcha(): void {
    const correctSum = this.dice1Value + this.dice2Value;

    if (this.userInput === correctSum) {
      this.captchaResolved.emit(true);
    } else {
      this.captchaResolved.emit(false);
    }
  }
}
