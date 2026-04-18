import { Injectable, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { HttpClient,  } from '@angular/common/http';
import { Evento } from '../../shared/models/evento.model';
import { Cloudinary } from '@cloudinary/url-gen/index';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { fill, thumbnail } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
   private apiUrl = 'http://localhost:8080/eventos';
   private cloudinary: Cloudinary;
  private cloudName = 'dnnmhrmwf'; // Substitua
  private uploadPreset = 'eventos_preset'

  constructor(private http: HttpClient) {
      this.cloudinary = new Cloudinary({
      cloud: {
        cloudName: this.cloudName
      }
    });
  }

  listarEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrl);
  }
  
  buscarEventoPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }
   
  criarEvento(evento: Partial<Evento>): Observable<Evento> {
    return this.http.post<Evento>(this.apiUrl, evento);
  }

  atualizarEvento(id: number, evento: Partial<Evento>): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/${id}`, evento);
  }

  deletarEvento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImagemCloudinary(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'eventos');

    return this.http.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      formData
    );
  }

  removerImagem(idEvento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idEvento}/imagem`);
  }

  
  
  getImagemHeroUrl(publicId: string): string {
    if (!publicId) return 'assets/images/evento-placeholder.jpg';
    
    const image = this.cloudinary.image(publicId);
    image.resize(fill().width(1920).height(600));
    image.delivery(format('auto')).delivery(quality('auto'));
    
    return image.toURL();
  }

  
  getImagemUrl(imagemPrincipal: string | undefined): string {
  console.log('getImagemUrl recebeu:', imagemPrincipal); // Debug
  
  if (!imagemPrincipal) {
    return 'assets/images/evento-placeholder.jpg';
  }
  
  // Se já for URL completa do Cloudinary
  if (imagemPrincipal.startsWith('http')) {
    return imagemPrincipal;
  }
  
  // Se for publicId do Cloudinary (ex: "eventos/abc123")
  if (imagemPrincipal.includes('/') || imagemPrincipal.startsWith('eventos')) {
    const url = this.getImagemCloudinaryUrl(imagemPrincipal);
    console.log('URL do Cloudinary gerada:', url);
    return url;
  }
  
  // Fallback para sistema antigo
  return `http://localhost:8080/arquivos/${imagemPrincipal}`;
}
getImagemCloudinaryUrl(publicId: string): string {
  if (!publicId) return 'assets/images/evento-placeholder.jpg';
  
  let cleanPublicId = publicId;
  if (cleanPublicId.includes('cloudinary.com')) {
    const match = cleanPublicId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    cleanPublicId = match ? match[1] : cleanPublicId;
  }
  
  const image = this.cloudinary.image(cleanPublicId);
  image.resize(thumbnail().width(500).height(500).gravity(autoGravity()));
  image.delivery(format('auto'));
  image.delivery(quality('auto'));
  
  return image.toURL();
}

}
