export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: number;
  email: string;
  tipoUsuario: 'paciente' | 'especialista' | 'administrador';
  obraSocial?: string | null;
  aprobado: boolean;
  imgUrl1?: string | null;
  imgUrl2?: string | null;
  especialidades?: string[];
}
