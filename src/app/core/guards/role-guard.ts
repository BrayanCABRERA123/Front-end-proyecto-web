import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, UserRole } from '../services/auth';

// Restricts a feature module's routes to accounts with one of the given roles.
// Usage: canActivate: [authGuard, roleGuard(['ADMIN'])] on the module's parent route.
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    const user = auth.getCurrentUser();

    if (user && allowedRoles.includes(user.rol)) return true;

    return router.createUrlTree([auth.homeRouteFor(user?.rol ?? 'CLIENT')]);
  };
}
