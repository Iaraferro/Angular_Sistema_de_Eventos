import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Arquivo } from '../../shared/models/arquivo.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArquivoService {
  private apiUrl = `${environment.apiUrl}/eventos`;
  private arquivosUrl = `${environment.apiUrl}/arquivos`;

  constructor(private http: HttpClient) {}

  upload(idEvento: number, file: File): Observable<Arquivo> {
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('nomeArquivo', file.name);
    return this.http.post<Arquivo>(`${this.apiUrl}/${idEvento}/arquivos`, formData);
  }

  listarPorEvento(idEvento: number): Observable<Arquivo[]> {
    return this.http.get<Arquivo[]>(`${this.apiUrl}/${idEvento}/arquivos`);
  }

  baixar(nomeArquivo: string): Observable<Blob> {
    return this.http.get(`${this.arquivosUrl}/${nomeArquivo}`, {
      responseType: 'blob',
    });
  }

  deletar(nomeArquivo: string): Observable<void> {
    return this.http.delete<void>(`${this.arquivosUrl}/${nomeArquivo}`);
  }
}
