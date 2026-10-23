import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../services/auth';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor (F-02)', () => {
  const auth = { accessToken: vi.fn(), hasSession: vi.fn(), expireSession: vi.fn() };
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    Object.values(auth).forEach(f => f.mockReset());
    auth.accessToken.mockReturnValue('jwt-de-prueba');
    auth.hasSession.mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('pone el token solo en las llamadas a nuestra API', () => {
    http.get('/api/v1/bookings/me').subscribe();
    http.get('/assets/i18n/es.json').subscribe();

    expect(backend.expectOne('/api/v1/bookings/me').request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');
    expect(backend.expectOne('/assets/i18n/es.json').request.headers.has('Authorization')).toBe(false);
  });

  it('un 401 de una ruta privada con sesión la da por vencida', () => {
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/client/payment');
    http.get('/api/v1/users/me').subscribe({ error: () => undefined });

    backend.expectOne('/api/v1/users/me').flush({ code: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.expireSession).toHaveBeenCalledWith('/client/payment');
  });

  it('un 401 del login (credenciales malas) o sin sesión no cierra nada', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/auth/login').flush({ code: 'INVALID_CREDENTIALS' }, { status: 401, statusText: 'Unauthorized' });

    auth.hasSession.mockReturnValue(false);
    http.get('/api/v1/users/me').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/users/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.expireSession).not.toHaveBeenCalled();
  });
});
