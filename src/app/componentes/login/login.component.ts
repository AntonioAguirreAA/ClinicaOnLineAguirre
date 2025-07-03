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
import { Usuario } from '../../clases/usuario';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
})
export class LoginComponent {
  /* ═════════ FORM ═════════ */
  loginForm: FormGroup;

  /* ═════════ FLAGS de error ═════════ */
  flagError = false;
  msjError = '';

  /* ═════════ Usuarios demo (acceso rápido) ═════════ */
  usuariosAccesoRapido = [
    {
      email: 'admin@admin.com',
      password: '123123',
      imgUrl: 'https://cdn-icons-png.freepik.com/512/9703/9703596.png',
    },
    {
      email: 'especialista1@especialista1.com',
      password: '123123',
      imgUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Fred_Engels.png/250px-Fred_Engels.png',
    },
    {
      email: 'especialista2@especialista2.com',
      password: '123123',
      imgUrl:
        'https://media.ambito.com/p/8cd3270a29724a4b8b3076fd1bdb80b5/adjuntos/239/imagenes/038/536/0038536692/julio-cortazarjpg.jpg',
    },
    {
      email: 'user1@user1.com',
      password: '123123',
      imgUrl: 'https://www.elviejotopo.com/wp-content/uploads/2017/11/Lenin-3.jpg',
    },
    {
      email: 'user2@user2.com',
      password: '123123',
      imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Marie_Curie_%281900%29.jpg/250px-Marie_Curie_%281900%29.jpg',
    },
    {
      email: 'user3@user3.com',
      password: '123123',
      imgUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGLFzRj3U0vDSk-g6cFN3jaNxgF1DUb19Skw&s',
    },
  ];

  /* ═════════ ctor ═════════ */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /* ═════════ Acceso rápido  ═════════ */
  async autocompletar(u: { email: string; password: string }) {
    /* 1. copia las credenciales al formulario */
    this.loginForm.setValue({ email: u.email, password: u.password });

    /* 2. dispara la lógica de login; el formulario ya es válido */
    await this.login();
  }

  /* ═════════ LÓGICA LOGIN  ═════════ */
  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      /* ------------------ 1️⃣  PRE-CHEQUEO EN BD ------------------ */
      const { data: pre, error: preErr } = await this.auth
        .getSupabase()
        .from('usuarios')
        .select('id, tipo_usuario, aprobado')
        .eq('email', email)
        .single();

      if (preErr || !pre) {
        throw new Error('Usuario no registrado en la base de datos.');
      }

      if (pre.tipo_usuario === 'especialista' && !pre.aprobado) {
        throw new Error(
          'Tu cuenta de especialista aún no fue aprobada por un administrador.'
        );
      }

      /* ------------------ 2️⃣  SIGN-IN AUTÉNTICO ------------------ */
      await this.auth.login(email, password);

      const user = this.auth.getCurrentUser();
      const perfil: Usuario = await this.auth.getUserProfile();

      if (perfil.tipoUsuario !== 'administrador' && !user?.email_confirmed_at) {
        await this.auth.logout();
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      /* ------------------ 3️⃣  LOG DE ACCESO (opcional) ----------- */
      await this.auth
        .getSupabase()
        .from('login_logs')
        .insert({ user_id: user!.id, email: user!.email });

      /* ------------------ 4️⃣  OK ------------------ */
      await Swal.fire({
        icon: 'success',
        title: 'Bienvenid@',
        text: 'Has iniciado sesión correctamente',
      });
      this.router.navigate(['/home']);
    } catch (err: any) {
      /* aseguramos cerrar sesión ante cualquier fallo posterior */
      await this.auth.logout();

      const msg =
        err?.message ??
        err?.error_description ??
        'Credenciales inválidas o usuario inexistente';

      this.flagError = true;
      this.msjError = msg;
      Swal.fire({ icon: 'error', title: 'Error de login', text: msg });
    }
  }
}
