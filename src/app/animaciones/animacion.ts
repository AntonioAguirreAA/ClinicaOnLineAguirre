import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  // Slide horizontal
  transition('HomePage <=> LoginPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  transition('LoginPage <=> MiPerfil', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'rotate(360deg)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'rotate(0deg)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'rotate(0deg)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'rotate(-360deg)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  transition('* => MiPerfil', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Slide vertical
  transition('LoginPage <=> RegisterPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),
  transition('MiPerfil <=> SolicitarTurno', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'rotateY(180deg) scale(0.5)', opacity: 0 }),
        animate('800ms ease-out', style({ transform: 'rotateY(0) scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'rotateY(0) scale(1)', opacity: 1 }),
        animate('800ms ease-in', style({ transform: 'rotateY(180deg) scale(0.5)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Fade in/out
  transition('RegisterPage <=> UsuariosPage', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ opacity: 1 }),
        animate('400ms ease-in', style({ opacity: 0 }))
      ], { optional: true })
    ])
  ]),
  
  transition('HomePage <=> Turnos', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(-100%) translateY(100%)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateX(0) translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0) translateY(0)', opacity: 1 }),
        animate('600ms ease-in', style({ transform: 'translateX(100%) translateY(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),


  // Scale effect
  transition('UsuariosPage <=> Estadisticas', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('400ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Flip effect
  transition('Estadisticas <=> Pacientes', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'rotateY(90deg)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'rotateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'rotateY(0)', opacity: 1 }),
        animate('400ms ease-in', style({ transform: 'rotateY(90deg)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  transition('Estadisticas <=> MiPerfil', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ transform: 'translate(-100%, 100%)', opacity: 0 }),
        animate('700ms ease-out', style({ transform: 'translate(0, 0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translate(0, 0)', opacity: 1 }),
        animate('700ms ease-in', style({ transform: 'translate(100%, -100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  transition('* <=> UsuariosPage', [
    group([
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  transition('* => Estadisticas', [
    group([
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Zoom in/out
  transition('* <=> NotFoundPage', [
    group([
      query(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('500ms ease-in', style({ transform: 'scale(0.8)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),
  transition('* <=> *', [
    group([
      query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ], { optional: true }),
      query(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('500ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ], { optional: true })
    ])
  ])
]);
