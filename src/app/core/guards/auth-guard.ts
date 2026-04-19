import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { inject, Injectable } from '@angular/core';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // ✅ Só verifica se está logado - NÃO força login em rotas públicas
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  // ✅ Verifica se o token ainda é válido no backend
  return authService.verifyToken().pipe(
    take(1),
    map(isValid => {
      if (!isValid) {
        authService.logout();
        router.navigate(['/login']);
        return false;
      }
      
      // ✅ Verifica se é admin (opcional, só para rotas admin)
      // Como o guard só é usado nas rotas /admin, já sabemos que precisa ser admin
      if (!authService.isAdmin()) {
        router.navigate(['/']);
        return false;
      }
      
      return true;
    })
  );
};