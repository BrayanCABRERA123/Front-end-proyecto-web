import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../services/auth';
import { authGuard, guestGuard } from './auth-guard';

describe('authGuard y guestGuard (F-02)', () => {
  const auth = { isAuthenticated: vi.fn(), hasAnyRole: vi.fn(), homeRoute: vi.fn() };

  const run = (guard: CanActivateFn, roles?: string[], url = '/admin/payments') =>
    TestBed.runInInjectionContext(() => guard(
      { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot,
      { url } as RouterStateSnapshot));

  const urlOf = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    Object.values(auth).forEach(f => f.mockReset());
    auth.homeRoute.mockReturnValue('/client');
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });

  it('sin sesión manda al login recordando la página pedida', () => {
    auth.isAuthenticated.mockReturnValue(false);

    expect(urlOf(run(authGuard, ['ADMIN']))).toBe('/auth?returnUrl=%2Fadmin%2Fpayments');
  });

  it('con sesión pero sin el rol de la ruta lo devuelve a su inicio', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.hasAnyRole.mockReturnValue(false);

    expect(urlOf(run(authGuard, ['ADMIN']))).toBe('/client');
    expect(auth.hasAnyRole).toHaveBeenCalledWith(['ADMIN']);
  });

  it('con el rol correcto, o en una ruta sin roles, deja pasar', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.hasAnyRole.mockReturnValue(true);

    expect(run(authGuard, ['ADMIN'])).toBe(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard: el login no se muestra a quien ya tiene sesión', () => {
    auth.isAuthenticated.mockReturnValue(true);
    expect(urlOf(run(guestGuard))).toBe('/client');

    auth.isAuthenticated.mockReturnValue(false);
    expect(run(guestGuard)).toBe(true);
  });
});
