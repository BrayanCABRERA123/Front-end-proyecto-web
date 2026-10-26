import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Route, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { routes } from '../../app.routes';
import { UserRole } from '../models/auth.models';
import { AuthService } from '../services/auth';
import { authInterceptor } from '../interceptors/auth-interceptor';

// F-02 / H-03: sin dobles. AuthService real con una sesión guardada como la deja el login, y las
// rutas reales de la app (app.routes.ts), para que un cambio en cualquiera de las dos se note aquí
const STORAGE_KEY = 'auth_session';

function saveSession(roles: UserRole[], expiresInMs = 3_600_000): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    accessToken: 'jwt-real',
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    user: { id: 1, email: 'ana@gmail.com', documentNumber: '1', firstName: 'Ana', lastName: 'Ruiz', phone: null,
      roles, active: true, lastLogin: null },
  }));
}

describe('authGuard con la sesión y las rutas reales (F-02)', () => {
  const routeOf = (path: string) => routes.find(r => r.path === path) as Route;

  // corre los guards que declara la ruta, igual que el router
  function enter(path: string, url = `/${path}`): true | string {
    const route = routeOf(path);
    for (const guard of (route.canActivate ?? []) as CanActivateFn[]) {
      const result = TestBed.runInInjectionContext(() => guard(
        { data: route.data ?? {} } as unknown as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
      if (result !== true) return TestBed.inject(Router).serializeUrl(result as UrlTree);
    }
    return true;
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('cada área exige su rol en app.routes', () => {
    expect(routeOf('admin').data?.['roles']).toEqual(['ADMIN']);
    expect(routeOf('operator').data?.['roles']).toEqual(['OPERATOR']);
    expect(routeOf('client').data?.['roles']).toEqual(['CLIENT']);
  });

  const cases: [UserRole, string, true | string][] = [
    ['ADMIN', 'admin', true], ['ADMIN', 'operator', '/admin'], ['ADMIN', 'client', '/admin'],
    ['OPERATOR', 'operator', true], ['OPERATOR', 'admin', '/operator'], ['OPERATOR', 'client', '/operator'],
    ['CLIENT', 'client', true], ['CLIENT', 'admin', '/client'], ['CLIENT', 'operator', '/client'],
  ];
  for (const [role, area, expected] of cases) {
    it(`${role} en /${area} → ${expected === true ? 'entra' : expected}`, () => {
      saveSession([role]);
      expect(enter(area)).toBe(expected);
    });
  }

  it('sin sesión cualquier área manda al login con la página pedida', () => {
    expect(enter('admin', '/admin/payments')).toBe('/auth?returnUrl=%2Fadmin%2Fpayments');
  });

  it('con el token vencido (1 h, ADR-006) también manda al login', () => {
    saveSession(['ADMIN'], -1000);
    expect(enter('admin', '/admin/payments')).toBe('/auth?returnUrl=%2Fadmin%2Fpayments');
  });

  it('el login (guestGuard) manda a su inicio a quien ya tiene sesión', () => {
    saveSession(['OPERATOR']);
    expect(enter('auth')).toBe('/operator');
  });
});

describe('authInterceptor ante un 401 con AuthService real (F-02)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    saveSession(['CLIENT']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    backend.verify();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('un 401 de una ruta privada borra la sesión guardada y vuelve al login marcando "vencida"', () => {
    vi.spyOn(router, 'url', 'get').mockReturnValue('/client/history');
    http.get('/api/v1/bookings/me').subscribe({ error: () => undefined });

    const request = backend.expectOne('/api/v1/bookings/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-real');
    request.flush({ code: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], { queryParams: { returnUrl: '/client/history', expired: true } });
  });

  it('un 403 (sin permiso) o un 401 de credenciales no cierran la sesión', () => {
    http.get('/api/v1/admin/payments').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/admin/payments').flush({ code: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });
    http.post('/api/v1/auth/password/verify', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/auth/password/verify').flush({ code: 'INVALID_RESET_CODE' }, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('después de vencer, la siguiente petición sale sin token', () => {
    http.get('/api/v1/users/me').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/users/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    http.get('/api/v1/catalog').subscribe();
    expect(backend.expectOne('/api/v1/catalog').request.headers.has('Authorization')).toBe(false);
  });
});
