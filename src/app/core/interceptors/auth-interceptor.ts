import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Ignora requests específicos
  const skipUrls = ['cloudinary.com', '/auth/login', '/auth/refresh', '/auth/verify'];
  if (skipUrls.some(url => req.url.includes(url))) {
    return next(req);
  }
  
  const token = authService.getToken();
  
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Token expirado - tenta refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            const newAuthReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(newAuthReq);
          }),
          catchError(refreshError => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      // Erro 403 - Sem permissão
      if (error.status === 403) {
        console.warn('Acesso negado:', error.error?.message);
      }
      
      return throwError(() => error);
    })
  );
};