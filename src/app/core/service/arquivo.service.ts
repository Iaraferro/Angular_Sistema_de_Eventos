import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArquivoService {
  private apiUrl = `${environment.apiUrl}/eventos`;
  private cloudName = environment.cloudinaryCloudName;
  private uploadPreset = environment.cloudinaryUploadPreset;

  constructor(private http: HttpClient) {}

  uploadCloudinary(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'eventos/arquivos');

    return this.http.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      formData,
    );
  }

  salvarNoBackend(
    idEvento: number,
    nomeOriginal: string,
    urlCloudinary: string,
    mimeType: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idEvento}/arquivos`, {
      nomeOriginal,
      urlCloudinary,
      mimeType,
    });
  }

  listarPorEvento(idEvento: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idEvento}/arquivos`);
  }

  deletar(idEvento: number, idArquivo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idEvento}/arquivos/${idArquivo}`);
  }
}
