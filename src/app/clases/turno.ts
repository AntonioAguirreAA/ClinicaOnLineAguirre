export class Turno {
  id: string;
  fecha: Date;
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
  especialidad: string;
  paciente: string;
  especialista: string;
  pacienteNombre?: string;
  especialistaNombre?: string;
  resenaPaciente = '';
  resenaEspecialista = '';
  comentario = '';
  diagnostico = '';
  historiaClinica: {
    altura: number; peso: number; temperatura: number;
    presion: string; datosDinamicos: { clave: string; valor: string }[];
  }[] = [];
  calif_paciente?: number;

  encuesta: { pregunta: string; respuesta: string }[] = [];

  constructor(
    id: string,
    fecha: Date,
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado',
    especialidad: string,
    paciente: string,
    especialista: string,
    pacienteNombre?: string,
    especialistaNombre?: string,
    resenaPaciente = '',
    resenaEspecialista = '',
    comentario = '',
    diagnostico = '',
    historiaClinica: {
      altura: number; peso: number; temperatura: number;
      presion: string; datosDinamicos: { clave: string; valor: string }[];
    }[] = [],
    calif_paciente?: number,
    encuesta: { pregunta: string; respuesta: string }[] = []
  ) {
    this.id = id; this.fecha = fecha; this.estado = estado;
    this.especialidad = especialidad;
    this.paciente = paciente; this.especialista = especialista;
    this.pacienteNombre = pacienteNombre;
    this.especialistaNombre = especialistaNombre;
    this.resenaPaciente = resenaPaciente;
    this.resenaEspecialista = resenaEspecialista;
    this.comentario = comentario;
    this.diagnostico = diagnostico;
    this.historiaClinica = historiaClinica;
    this.calif_paciente = calif_paciente;
    this.encuesta = encuesta;
  }
}
export type EstadoTurno =
  | 'pendiente'
  | 'aceptado'
  | 'realizado'
  | 'cancelado'
  | 'rechazado';