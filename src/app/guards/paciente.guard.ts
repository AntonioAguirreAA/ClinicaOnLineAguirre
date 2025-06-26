import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service'; // Asegúrate de importar tu servicio de autenticación
import { Usuario } from '../clases/usuario'; // Asegúrate de importar la interfaz de Usuario  
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PacienteGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const userProfile: Usuario = await this.authService.getUserProfile();

    if (userProfile && userProfile.tipoUsuario === 'paciente') {
      return true; 
    } else {
      Swal.fire('Acceso denegado', 'Solo los Pacientes pueden acceder a esta sección.', 'error');
      this.router.navigate(['/home']); 
      return false; 
    }
  }
}
