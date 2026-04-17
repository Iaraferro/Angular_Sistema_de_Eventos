export interface Auth {
    username: string;
    senha: string;
}

export interface Perfil {
    id: number;
    nome: string; // "Adm" ou "User"
}

export interface UsuarioResponse {
    nome: string;
    id: number;
    username: string;
    perfil: Perfil;
    email: string;
}

export interface UsuarioCreateDTO {
    nome: string;
    email: string;
    username: string;
    senha: string;
    id_perfil: number; // 1 = Adm, 2 = User
}