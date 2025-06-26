/**  Modelo unificado que cubre Paciente, Especialista y Administrador  */
export class Usuario {
  /* ---------- claves y rol ---------- */
  id: string; // = id de Supabase-Auth
  tipoUsuario: 'paciente' | 'especialista' | 'administrador';

  /* ---------- datos personales ---------- */
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;

  /* ---------- contacto ---------- */
  email: string;

  /* ---------- imágenes ---------- */
  imgUrl1: string; // siempre
  imgUrl2?: string; // solo pacientes

  /* ---------- estado y seguridad ---------- */
  aprobado: boolean; // especialistas
  contrasena?: string; // (solo local, nunca lo envíes al back)

  /* ---------- campos específicos ---------- */
  obraSocial?: string; // solo pacientes
  especialidades?: string[]; // solo especialistas
  ultimosTurnos?: { fecha: string; detalle: string }[];

  /* ---------- ctor flexible ---------- */
  constructor(data: Partial<Usuario>) {
    this.id = data.id || '';
    this.tipoUsuario = data.tipoUsuario || 'administrador';
    this.nombre = data.nombre || '';
    this.apellido = data.apellido || '';
    this.edad = data.edad || 0;
    this.dni = data.dni || 0;
    this.email = data.email || '';
    this.imgUrl1 = data.imgUrl1 || '';
    this.imgUrl2 = data.imgUrl2 || '';
    this.aprobado = data.aprobado !== undefined ? data.aprobado : true;
    this.contrasena = data.contrasena;
    this.obraSocial = data.obraSocial;
    this.especialidades = data.especialidades || [];
    this.ultimosTurnos = data.ultimosTurnos || [];
  }
}
