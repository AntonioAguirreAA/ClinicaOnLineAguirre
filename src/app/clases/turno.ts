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
  calif_paciente?: number | null;     
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
    calif_paciente: number | null = null,
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
    this.calif_paciente = calif_paciente;
    this.encuestaPaciente = '';
    // Inicializar historiaClinica y encuesta como arreglos vacíos si no se proporcionan
    this.historiaClinica = historiaClinica;
    this.encuesta = encuesta; 
    // Inicializar comentario y diagnostico como cadenas vacías si no se proporcionan
  
    this.comentario = comentario;
    this.historiaClinica = historiaClinica;
    this.diagnostico = diagnostico;
    this.encuesta = encuesta;
  }
}
