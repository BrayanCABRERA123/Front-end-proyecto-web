import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/auth.models';
import { AuthService } from '../services/auth';

// exige sesión iniciada y, si la ruta declara data.roles, que el usuario tenga uno de ellos.
// ejemplo: { path: 'admin', canActivate: [authGuard], data: { roles: ['ADMIN'] } }
// es solo experiencia de usuario: quien de verdad protege los datos es el backend
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } });
  }

  const roles = route.data?.['roles'] as UserRole[] | undefined;

  if (roles?.length && !auth.hasAnyRole(roles)) {
    // tiene sesión pero no es su área: lo mandamos a su propia pantalla de inicio
    return router.createUrlTree([auth.homeRoute()]);
  }

  return true;
};

// para login/registro/recuperación: si ya tiene sesión, no tiene sentido mostrarlos
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree([auth.homeRoute()]) : true;
};
