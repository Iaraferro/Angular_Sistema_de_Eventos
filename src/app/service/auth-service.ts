import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';



export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'organizador' | 'participante';
  token?: string;
}

export interface LoginResponse {
  usuario: User;
  token: string;
  mensagem: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  /**
   * Carrega usuário do localStorage ao iniciar
   */
  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.userKey);
    const storedToken = localStorage.getItem(this.tokenKey);
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erro ao carregar usuário do storage:', error);
        this.clearStorage();
      }
    }
  }

  /**
   * Login do usuário
   */
  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, senha })
      .pipe(
        tap(response => {
          if (response.token && response.usuario) {
            this.setSession(response);
          }
        })
      );
  }

  /**
   * Registro de novo usuário
   */
  register(nome: string, email: string, senha: string, tipo: string = 'participante'): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { nome, email, senha, tipo });
  }

  /**
   * Logout do usuário
   */
  logout(): void {
    const token = this.getToken();
    
    if (token) {
      // Notificar backend sobre logout (opcional)
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession() // Limpa mesmo com erro
      });
    } else {
      this.clearSession();
    }
  }

  /**
   * Limpa sessão local
   */
  private clearSession(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Armazena dados da sessão
   */
  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.tokenKey, authResult.token);
    localStorage.setItem(this.userKey, JSON.stringify(authResult.usuario));
    this.currentUserSubject.next(authResult.usuario);
  }

  /**
   * Limpa storage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Verifica se usuário está logado
   */
  isLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    const token = this.getToken();
    return !!(user && token && !this.isTokenExpired());
  }

  /**
   * Verifica se token está expirado (simplificado)
   * Em produção, use uma biblioteca como jwt-decode
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodifica token JWT manualmente
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Converte para milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return true;
    }
  }

  /**
   * Retorna token atual
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Retorna usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica se usuário é administrador
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.tipo === 'admin';
  }

  /**
   * Verifica se usuário é organizador
   */
  isOrganizador(): boolean {
    const user = this.getCurrentUser();
    return user?.tipo === 'organizador' || user?.tipo === 'admin';
  }

  /**
   * Atualiza dados do usuário
   */
  updateUser(userData: Partial<User>): Observable<User> {
    const userId = this.getCurrentUser()?.id;
    const token = this.getToken();

    return this.http.put<User>(`${this.apiUrl}/usuario/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(updatedUser => {
        const currentUser = this.getCurrentUser();
        const newUser = { ...currentUser, ...updatedUser };
        localStorage.setItem(this.userKey, JSON.stringify(newUser));
        this.currentUserSubject.next(newUser);
      })
    );
  }

  /**
   * Solicita recuperação de senha
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/esqueci-senha`, { email });
  }

  /**
   * Redefine senha
   */
  resetPassword(token: string, novaSenha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/redefinir-senha`, { token, novaSenha });
  }

  /**
   * Altera senha (usuário logado)
   */
  changePassword(senhaAtual: string, novaSenha: string): Observable<any> {
    const token = this.getToken();
    return this.http.post(`${this.apiUrl}/alterar-senha`, 
      { senhaAtual, novaSenha },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  /**
   * Verifica permissão para rota
   */
  hasPermission(tipoPermitido: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return tipoPermitido.includes(user.tipo);
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<any> {
    const token = this.getToken();
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh-token`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
      })
    );
  }
}
