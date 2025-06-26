export class Turno {
  id: string;
  fecha: Date;
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
  especialidad: string;
  paciente: string; 
  especialista: string; 
  pacienteNombre?: string; 
  especialistaNombre?: string; 
  resenaPaciente: string;
  resenaEspecialista: string;
  encuestaPaciente?: string;
  comentario: string = '';
  diagnostico: string = '';
  historiaClinica: {
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    datosDinamicos: { clave: string; valor: string }[];
  }[];
  encuesta: { pregunta: string; respuesta: string }[];

  constructor(
    id: string,
    fecha: Date,
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado',
    especialidad: string,
    paciente: string,
    especialista: string,
    pacienteNombre?: string,
    especialistaNombre?: string,
    resenaPaciente: string = '',
    resenaEspecialista: string = '',
    comentario: string = '',
    diagnostico: string = '',
    historiaClinica: {
      altura: number;
      peso: number;
      temperatura: number;
      presion: string;
      datosDinamicos: { clave: string; valor: string }[];
    }[] = [],
    encuesta: { pregunta: string; respuesta: string }[] = []
  ) {
    this.id = id;
    this.fecha = fecha;
    this.estado = estado;
    this.especialidad = especialidad;
    this.paciente = paciente;
    this.especialista = especialista;
    this.pacienteNombre = pacienteNombre;
    this.especialistaNombre = especialistaNombre;
    this.resenaPaciente = resenaPaciente;
    this.resenaEspecialista = resenaEspecialista;
    this.comentario = comentario;
    this.historiaClinica = historiaClinica;
    this.diagnostico = diagnostico;
    this.encuesta = encuesta;
  }
}
