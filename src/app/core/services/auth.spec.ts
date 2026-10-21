import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sesión compartida entre pestañas', () => {
    const session = (id: number) => JSON.stringify({
      accessToken: 'token-' + id,
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      user: { id, email: `u${id}@demo.com`, documentNumber: '1', firstName: 'Ana', lastName: 'Ruiz', phone: null,
        roles: ['CLIENT'], active: true, lastLogin: null }
    });
    let reload: ReturnType<typeof vi.fn<() => void>>;
    let router: Router;

    beforeEach(() => {
      localStorage.clear();
      localStorage.setItem('auth_session', session(1));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
      });
      service = TestBed.inject(AuthService);
      router = TestBed.inject(Router);
      reload = vi.fn<() => void>();
      (service as unknown as { reloadPage: () => void }).reloadPage = reload;
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    });

    afterEach(() => localStorage.clear());

    it('si otra pestaña cierra la sesión, esta vuelve al login', () => {
      localStorage.removeItem('auth_session');
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_session', newValue: null }));

      expect(service.hasSession()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/auth');
      expect(reload).not.toHaveBeenCalled();
    });

    it('si otra pestaña entra con otra cuenta, esta se recarga', () => {
      localStorage.setItem('auth_session', session(2));
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_session', newValue: session(2) }));

      expect(reload).toHaveBeenCalled();
    });

    it('si es la misma cuenta, solo toma la sesión nueva', () => {
      const updated = session(1).replace('token-1', 'token-1b');
      localStorage.setItem('auth_session', updated);
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_session', newValue: updated }));

      expect(service.accessToken()).toBe('token-1b');
      expect(reload).not.toHaveBeenCalled();
    });
  });
});
