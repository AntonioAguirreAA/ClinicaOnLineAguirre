export class Usuario {
	tipoUsuario: string;
	id: string;
	uid: string;
	nombre: string;
	apellido: string;
	edad: number;
	dni: number;
	imgUrl1: string;
	imgUrl2: string;
	email: string;
	contrasena: string;
	aprobado: boolean;
	especialidades?: string[];
	ultimosTurnos?: { fecha: string; detalle: string }[];

	constructor(tipoUsuario: string,  uid: string, id: string = '', nombre: string, apellido: string, edad: number, dni: number, imgUrl1: string, imgUrl2: string, email: string, contrasena: string, aprobado: boolean = false, especialidades?: string[]) {
		this.tipoUsuario = tipoUsuario;
		this.id = id;
		this.uid = uid;
		this.nombre = nombre;
		this.apellido = apellido;
		this.edad = edad;
		this.dni = dni;
		this.imgUrl1 = imgUrl1;
		this.imgUrl2 = imgUrl2;
		this.email = email;
		this.contrasena = contrasena;
		this.aprobado = aprobado;
		this.especialidades = especialidades;
		
	}
}