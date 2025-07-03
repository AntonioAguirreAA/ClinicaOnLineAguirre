import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from './servicios/auth.service';
import { NavbarBotonesDirective } from './directivas/navbar-botones.directive';
import { routeAnimations } from './animaciones/animacion';


@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  animations: [routeAnimations],
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    NavbarBotonesDirective,
  ],
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  tipoUsuario: string | null = null;
  fullName = ''; // 👈  nombre + apellido

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    /* sesión */
    this.auth.user$.subscribe((u) => (this.isLoggedIn = !!u));

    /* perfil */
    this.auth.userProfile$.subscribe((profile) => {
      this.tipoUsuario = profile?.tipoUsuario ?? null;
      this.fullName = profile ? `${profile.nombre} ${profile.apellido}` : '';
    });
  }

  logout() {
    this.auth.logout().then(() => this.router.navigate(['/home']));
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
