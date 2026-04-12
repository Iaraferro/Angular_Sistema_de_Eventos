import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { inject, Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class authGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      // Verificar se é admin para rotas admin
      const isAdminRoute = this.router.url.includes('/admin');
      if (isAdminRoute && !this.authService.isAdmin()) {
        this.router.navigate(['/']);
        return false;
      }
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}