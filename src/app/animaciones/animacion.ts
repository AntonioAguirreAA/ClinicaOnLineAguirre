import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [

  transition('MiPerfil <=> SolicitarTurno, MiPerfil => *, SolicitarTurno => *', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),

      query(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),

      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ], { optional: true }),
    ])
  ]),

  transition('MisTurnos <=> *, * => MisTurnos', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),

      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),

      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true }),
    ])
  ]),

  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-out', style({ opacity: 1 }))
    ], { optional: true })
  ])

]);
