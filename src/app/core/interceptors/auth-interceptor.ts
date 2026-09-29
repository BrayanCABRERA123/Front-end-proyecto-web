import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { AuthService } from '../services/auth';

// endpoints donde un 401 significa "credenciales/código incorrectos", no "sesión vencida"
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/password/'];

// agrega "Authorization: Bearer <token>" SOLO a las llamadas a nuestra API,
// para que el token nunca viaje a otros dominios (traducciones, CDNs, etc.)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE_URL)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isPublic = PUBLIC_AUTH_PATHS.some(path => req.url.includes(path));

      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublic) {
        auth.expireSession(router.url);
      }

      return throwError(() => error);
    })
  );
};
