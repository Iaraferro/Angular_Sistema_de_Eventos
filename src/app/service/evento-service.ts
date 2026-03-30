import { Injectable, OnInit } from '@angular/core';
import { Evento } from '../models/evento.model';
import { Observable } from 'rxjs';
import { HttpClient,  } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
   private apiUrl = 'http://localhost:8080/eventos';

  constructor(private http: HttpClient) {}

  buscarEventoPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  participarEvento(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/participar`, {});
  }
  listarEvento(): Observable<Evento[]>{
    return this.http.get<Evento[]>(this.apiUrl);

  }
  criarEvento(evento: Evento): Observable<Evento>{
    return this.http.post<Evento>(this.apiUrl, evento)
  }
}
