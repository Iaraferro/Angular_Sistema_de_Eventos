import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Auth, UsuarioResponse } from '../../shared/models/auth.model';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080';
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

  login(credentials: Auth): Observable<string> {
    return this.http.post(`${this.apiUrl}/auth`, credentials, { responseType: 'text' }).pipe(
      tap(token => {
        if (token) {
          this.setToken(token);
          this.fetchCurrentUser(token).subscribe();
        }
      })
    );
  }

  fetchCurrentUser(token: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
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
    return user?.perfil?.nome === 'Adm';
  }

  getCurrentUser(): UsuarioResponse | null {
    return this.currentUserSubject.value;
  }
}