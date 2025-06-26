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
      email: 'teyvatmerch@gmail.com',
      password: '123123',
      imgUrl:
        'https://tsosbachehngqtnsgkum.supabase.co/storage/v1/object/public/imagenes/usuarios/e391a45d-2b4e-482b-adfa-216b47e62765/1-Eidolon_Phainon.png',
    },
    {
      email: 'especialista@especialista.com',
      password: '123123',
      imgUrl:
        'https://t4.ftcdn.net/jpg/02/60/04/09/360_F_260040900_oO6YW1sHTnKxby4GcjCvtypUCWjnQRg5.jpg',
    },
    {
      email: 'demo4@demo.com',
      password: '123123',
      imgUrl: 'assets/demo/esp1.jpg',
    },
    {
      email: 'demo5@demo.com',
      password: '123123',
      imgUrl: 'assets/demo/esp2.jpg',
    },
    {
      email: 'admin@demo.com',
      password: '123123',
      imgUrl: 'assets/demo/admin.jpg',
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
