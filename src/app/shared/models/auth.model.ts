export interface Auth {
  username: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  type: string;      // "Bearer"
  expiresIn: number; // segundos
  user: UsuarioResponse;
}

export interface Perfil {
  id: number;
  nome: string;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  username: string;
  email: string;
  perfil: Perfil;
}

export interface UsuarioCreateDTO {
  nome: string;
  email: string;
  username: string;
  senha: string;
  id_perfil: number;
}