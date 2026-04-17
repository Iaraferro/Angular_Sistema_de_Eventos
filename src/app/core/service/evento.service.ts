import { Injectable, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { HttpClient,  } from '@angular/common/http';
import { Evento } from '../../shared/models/evento.model';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
   private apiUrl = 'http://localhost:8080/eventos';

  constructor(private http: HttpClient) {}

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

  uploadImagem(idEvento: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagem', file);
    formData.append('nomeArquivo', file.name);
    return this.http.post(`${this.apiUrl}/${idEvento}/imagem`, formData);
  }

  removerImagem(idEvento: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idEvento}/imagem`);
  }

  getImagemUrl(nomeArquivo: string | null | undefined): string {
    if (!nomeArquivo) return '';
    if (nomeArquivo.startsWith('http')) return nomeArquivo;
    return `http://localhost:8080/arquivos/${nomeArquivo}`;
  }

}
