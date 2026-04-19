import { HttpClient } from "@angular/common/http";
import { Inscricao, InscricaoCreateDTO } from "../../shared/models/inscricao.model";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'  
})
export class InscricaoService{
    private apiUrl = `${environment.apiUrl}/inscricoes`

    constructor(private http: HttpClient){}

    criarInscricao(inscricao: InscricaoCreateDTO): Observable<Inscricao> {
      return this.http.post<Inscricao>(this.apiUrl, inscricao);
    }

    listarPorEvento(eventoId: number): Observable<Inscricao[]> {
      return this.http.get<Inscricao[]>(`${this.apiUrl}/evento/${eventoId}`);
    }

    listarTodas(): Observable<Inscricao[]> {
      return this.http.get<Inscricao[]>(this.apiUrl);
    }

    deletarInscricao(id: number): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
    
    // Método otimizado para carregar todas as inscrições de uma vez
    listarTodasComEventos(): Observable<Inscricao[]> {
      return this.http.get<Inscricao[]>(`${this.apiUrl}/completa`);
    }
}

