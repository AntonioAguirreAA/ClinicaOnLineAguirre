// route-animations.ts
import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [

  transition('MiPerfil <=> SolicitarTurno, MiPerfil => *, SolicitarTurno => *', [
    group([
      query(':enter, :leave',
        style({ position: 'absolute', width: '100%' }),
        { optional: true }
      ),

      /* vista entrante: aparece desde arriba */
      query(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('600ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ], { optional: true }),

      /* vista saliente: se desliza hacia abajo y se desvanece */
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('600ms ease-in',
          style({ transform: 'translateY(100%)', opacity: 0 })
        )
      ], { optional: true }),
    ])
  ]),

]);
