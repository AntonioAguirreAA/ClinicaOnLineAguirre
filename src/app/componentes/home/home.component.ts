import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule],
  standalone: true,
})
export class HomeComponent {
  titulo = 'BIENVENIDO A LA CLINICA ONLINE';

  constructor(private router: Router) {}

  navegarLogin() {
    this.router.navigate(['/ingresar']);
  }

  navegarRegistro() {
    this.router.navigate(['/registro']);
  }
}
