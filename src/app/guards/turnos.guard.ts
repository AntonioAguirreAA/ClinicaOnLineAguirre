import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TurnosGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.getUserProfile(); // Asegúrate de que `getCurrentUserProfile` devuelva el perfil del usuario

    if (user.tipoUsuario === 'paciente') {
      this.router.navigate(['/mis-turnos-paciente']);
    } else if (user.tipoUsuario === 'especialista') {
      this.router.navigate(['/mis-turnos-especialista']);
    } else {
      // Si el tipo de usuario no es válido, redirige a otra página, como el home
      this.router.navigate(['/home']);
    }

    return false; // Siempre devuelve `false` para evitar cargar el componente TurnosComponent directamente
  }
}
