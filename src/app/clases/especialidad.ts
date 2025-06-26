export class Especialidad {
    id: string;
    nombre: string;
    imgUrl?: string;
  
    constructor(id: string, nombre: string, imgUrl: string) {
      this.id = id;
      this.nombre = nombre; 
      this.imgUrl = imgUrl;
    }
}