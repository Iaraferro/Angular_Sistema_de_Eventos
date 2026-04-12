export interface Arquivo {
  id: number;
  nomeOriginal: string;
  nomeSalvo: string;
  mimeType: string;
  dataUpload: string;
  evento?: any;
}
