import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { Auth, AuthResponse, UsuarioResponse } from '../../shared/models/auth.model';
import { environment } from '../../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
 private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';
  
  private currentUserSubject = new BehaviorSubject<UsuarioResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.userKey);
    const token = this.getToken();
    if (storedUser && token) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (e) {
        this.clearStorage();
      }
    }
  }

  login(credentials: Auth): Observable<UsuarioResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            this.setCurrentUser(response.user);
          }
        }),
        map(response => response.user)
      );
  }

  private setCurrentUser(user: UsuarioResponse): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  fetchCurrentUser(): Observable<UsuarioResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token');
    }
    
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios/perfil`)
      .pipe(
        tap(user => {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.perfil?.nome?.toLowerCase() === 'adm';
  }

  getCurrentUser(): UsuarioResponse | null {
    return this.currentUserSubject.value;
  }

  // Adicione este método - verifica se o token é válido
verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);
    return of(true);
  }

  
  refreshToken(): Observable<string> {
    // Se não tem endpoint de refresh, só retorna o token atual
    const token = this.getToken();
    if (token) {
      return of(token);
    }
    this.logout();
    return throwError(() => new Error('No token to refresh'));
  }
}