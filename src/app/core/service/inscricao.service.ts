import { HttpClient, HttpParams } from '@angular/common/http';
import { Inscricao, InscricaoCreateDTO } from '../../shared/models/inscricao.model';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class InscricaoService {
  private apiUrl = `${environment.apiUrl}/inscricoes`;

  constructor(private http: HttpClient) {}

  listarTodasPaginado(page: number = 0, size: number = 10): Observable<PaginatedResponse<Inscricao>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<PaginatedResponse<Inscricao>>(this.apiUrl, { params });
  }

  // Mantém o antigo para compatibilidade
  listarTodas(page = 0, size = 50): Observable<Inscricao[]> {
    return this.http.get<Inscricao[]>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  criarInscricao(inscricao: InscricaoCreateDTO): Observable<Inscricao> {
    return this.http.post<Inscricao>(this.apiUrl, inscricao);
  }

  listarPorEvento(eventoId: number): Observable<Inscricao[]> {
    return this.http.get<Inscricao[]>(`${this.apiUrl}/evento/${eventoId}`);
  }

  deletarInscricao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarTodasComEventos(): Observable<Inscricao[]> {
    return this.listarTodas();
  }
}
