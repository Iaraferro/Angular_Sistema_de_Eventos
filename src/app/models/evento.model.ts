import { Data } from "@angular/router";

export interface Evento {
  id?: number;
  nome: string;
  descricao: string;
  dataHora: string;
  local: string;
  categoria: string;
  organizador: string;
  contato: string;
  requisitos: string;
  participantes?: number;
  arquivos?: string[];
  imagem?: string;
}
