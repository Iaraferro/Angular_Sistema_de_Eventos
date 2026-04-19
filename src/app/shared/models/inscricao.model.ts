export interface Inscricao{
  id?: number;
  nome: string;
  email?: string;
  telefone: string;
  eventoId: number;
  eventoNome: string;
  dataInscricao: string; 
}

export interface InscricaoCreateDTO {
  eventoId: number;
  nome: string;
  email: string;
  telefone: string;
}