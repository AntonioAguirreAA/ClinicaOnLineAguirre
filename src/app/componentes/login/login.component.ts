import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { AuthService } from '../../servicios/auth.service';
import { HighlightUserTypeDirective } from '../../directivas/usuario-highlight.directive';
import { Usuario } from '../../clases/usuario';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    HighlightUserTypeDirective,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  flagError = false;
  msjError = '';

  /** Usuarios demo para autocompletar */
  usuariosAccesoRapido = [
    {
      nombre: 'Paciente',
      email: 'demo1@demo.com',
      password: '123456',
      imgUrl: '',
      tipoUsuario: 'paciente',
    },
    {
      nombre: 'Especialista',
      email: 'demo2@demo.com',
      password: '123456',
      imgUrl: '',
      tipoUsuario: 'especialista',
    },
    {
      nombre: 'Administrador',
      email: 'admin@demo.com',
      password: '123456',
      imgUrl: '',
      tipoUsuario: 'administrador',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService //  ⬅️ tu servicio Supabase
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /* ---------- demo autocomplete --------- */
  autocompletar(u: { email: string; password: string }) {
    this.loginForm.setValue({ email: u.email, password: u.password });
  }

  /* -------------- login --------------- */
  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      /* 1) Sign-in (lanza error si falla) */
      await this.auth.login(email, password);

      /* 2) Datos básicos */
      const user = this.auth.getCurrentUser();
      const perfil: Usuario = await this.auth.getUserProfile();

      /* 3) Comprobaciones */
      if (perfil.tipoUsuario !== 'administrador' && !user?.email_confirmed_at) {
        throw new Error('Correo no verificado. Por favor, revisa tu bandeja.');
      }

      if (perfil.tipoUsuario === 'especialista' && !perfil.aprobado) {
        throw new Error(
          'Tu cuenta de especialista está pendiente de aprobación.'
        );
      }

      /* 4) Registrar el acceso */
      await this.auth
        .getSupabase()
        .from('login_logs')
        .insert({ user_id: user?.id, email: user?.email });

      /* 5) Éxito */
      await Swal.fire({
        icon: 'success',
        title: 'Bienvenid@',
        text: 'Has iniciado sesión correctamente',
      });
      this.router.navigate(['/home']);
    } catch (err: any) {
      const msg =
        err.message ??
        err?.error_description ??
        'Credenciales inválidas o usuario inexistente';
      this.flagError = true;
      this.msjError = msg;

      Swal.fire({ icon: 'error', title: 'Error de login', text: msg });
    }
  }
}
