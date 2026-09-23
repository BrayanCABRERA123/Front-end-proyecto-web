import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';

// Adjunta el JWT de la sesión a cada petición al mock API. Si el backend responde 401
// en una ruta protegida (token vencido o inválido), cierra la sesión y manda al login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = /\/(login|register)$/.test(req.url);

      if (err.status === 401 && token && !isAuthEndpoint) {
        auth.logout();
        router.navigate(['/auth'], { queryParams: { redirect: router.url } });
      }

      return throwError(() => err);
    })
  );
};
