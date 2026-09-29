import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { AuthUser, LoginResponse, RegisterRequest, StoredSession, UserRole } from '../models/auth.models';
import { UserSession } from './user-session';

const STORAGE_KEY = 'auth_session';

// pantalla de inicio de cada rol (si tiene varios, gana el de más privilegios)
const HOME_BY_ROLE: [UserRole, string][] = [
  ['ADMIN', '/admin'],
  ['OPERATOR', '/operator'],
  ['CLIENT', '/client']
];

// sesión del usuario contra el security-service.
// el token (JWT) vive en localStorage para sobrevivir a recargas; dura 1 hora (ADR-006)
// y solo se envía a nuestra propia API (ver auth-interceptor).
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userSession = inject(UserSession);

  private readonly sessionSignal = signal<StoredSession | null>(this.load());

  readonly user = computed(() => this.sessionSignal()?.user ?? null);

  // true solo si hay token y todavía no vence
  isAuthenticated(): boolean {
    return this.accessToken() !== null;
  }

  // solo lectura: un token vencido se ignora aquí y se limpia en expireSession/logout
  accessToken(): string | null {
    const session = this.sessionSignal();

    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session.accessToken;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.user();
    return !!user && user.roles.some(role => roles.includes(role));
  }

  homeRoute(user: AuthUser | null = this.user()): string {
    if (!user) return '/auth';
    return HOME_BY_ROLE.find(([role]) => user.roles.includes(role))?.[1] ?? '/auth';
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => this.store({
          accessToken: response.accessToken,
          expiresAt: response.expiresAt,
          user: response.user
        })),
        map(response => response.user)
      );
  }

  register(request: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE_URL}/auth/register`, request);
  }

  // cierra la sesión en el servidor (deja rastro) y siempre limpia el navegador,
  // aunque el servidor no responda
  logout(): void {
    if (this.isAuthenticated()) {
      this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}).subscribe({ error: () => undefined });
    }
    this.clear();
    this.router.navigateByUrl('/auth');
  }

  // sesión vencida o token rechazado: limpiar y volver al login recordando a dónde iba
  expireSession(returnUrl?: string): void {
    this.clear();
    this.router.navigate(['/auth'], {
      queryParams: returnUrl ? { returnUrl, expired: true } : { expired: true }
    });
  }

  // recuperación de contraseña en 3 pasos
  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/password/forgot`, { email });
  }

  verifyResetCode(email: string, code: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/password/verify`, { email, code });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/password/reset`, { email, code, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/users/me/password`, { currentPassword, newPassword });
  }

  private store(session: StoredSession): void {
    this.sessionSignal.set(session);

    // perfil y sidebar leen de UserSession: se alimenta con los datos reales
    this.userSession.update({
      name: `${session.user.firstName} ${session.user.lastName}`,
      email: session.user.email,
      phone: session.user.phone ?? ''
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // modo privado o almacenamiento bloqueado: la sesión dura lo que dure la pestaña
    }
  }

  private clear(): void {
    this.sessionSignal.set(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('user');
    } catch {
      // nada que limpiar
    }
  }

  private load(): StoredSession | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const session = JSON.parse(saved) as StoredSession;
      return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
    } catch {
      return null;
    }
  }
}
