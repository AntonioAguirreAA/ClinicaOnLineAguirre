import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Usuario } from '../clases/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /* ---------- Supabase ---------- */
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  /* ---------- señales de sesión ---------- */
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private userProfileSubject = new BehaviorSubject<Usuario | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  /* ---------- ctor: escucha cambios de sesión ---------- */
  constructor() {
    /* usuario ya logueado al recargar */
    this.supabase.auth.getUser().then(({ data }) => {
      this.userSubject.next(data?.user ?? null);
      if (data?.user) this.loadUserProfile(data.user.id);
    });

    /* cambio de sesión en tiempo real */
    this.supabase.auth.onAuthStateChange((_evt, session) => {
      this.userSubject.next(session?.user ?? null);
      if (session?.user) {
        this.loadUserProfile(session.user.id);
      } else {
        this.userProfileSubject.next(null);
      }
    });
  }

  /* ---------- login / logout / registro ---------- */
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session?.user) await this.loadUserProfile(data.session.user.id);
    return data;
  }

  async registro(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    /* sprint 2: forzar logout tras alta */
    await this.logout();
    return { user: data.user };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.userSubject.next(null);
    this.userProfileSubject.next(null);
  }

  /* ---------- getters ---------- */
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }
  getSupabase(): SupabaseClient {
    return this.supabase;
  }
  async getUserProfile(): Promise<Usuario> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No hay usuario logueado');
    const cached = this.userProfileSubject.getValue();
    return cached ?? this.loadUserProfile(user.id);
  }

  /* ---------- carga de perfil en tabla usuarios ---------- */
  private async loadUserProfile(userId: string): Promise<Usuario> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error(error);
      this.userProfileSubject.next(null);
      throw new Error('Perfil de usuario no encontrado.');
    }

    /* mapear snake_case → camelCase si fuera necesario */
    const usuario: Usuario = {
    id:             data.id,
    nombre:         data.nombre,
    apellido:       data.apellido,
    edad:           data.edad,
    dni:            data.dni,
    email:          data.email,
    tipoUsuario:    data.tipo_usuario,        // ← ya estaba
    obraSocial:     data.obra_social,
    aprobado:       data.aprobado,
    imgUrl1:        data.img_url_1 ?? null,   // ← NUEVO
    imgUrl2:        data.img_url_2 ?? null,   // ← NUEVO
    especialidades: data.especialidades ?? [],
  };

    this.userProfileSubject.next(usuario);
    return usuario;
  }
}
