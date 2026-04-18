import { HttpClient } from "@angular/common/http";
import { Inscricao } from "../../shared/models/inscricao.model";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'  
})
export class InscricaoService{
    private apiUrl = 'http://localhost:8080/inscricoes'

    constructor(private http: HttpClient){}

    criarInscricao(inscricao: { eventoId: number; nome: string; email: string; telefone: string }): Observable<Inscricao> {
    return this.http.post<Inscricao>(this.apiUrl, inscricao);
  }

  listarPorEvento(eventoId: number): Observable<Inscricao[]> {
    return this.http.get<Inscricao[]>(`${this.apiUrl}/evento/${eventoId}`);
  }

  deletarInscricao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

