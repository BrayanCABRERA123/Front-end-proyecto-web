import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

export type UserRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  iniciales: string;
  rol: UserRole;
  aceptaTerminos: boolean;
  aceptaPoliticaDatos: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// Talks to mock-api/server.cjs (/login, /register, /me). Session is cached in localStorage
// under the same 'token' / 'user' keys the sidebar's logout() already clears.
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly baseUrl = 'http://localhost:3000';
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  constructor(private http: HttpClient) {}

  login(correo: string, contrasena: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { correo, contrasena }).pipe(
      tap(res => this.storeSession(res)),
      catchError((err: HttpErrorResponse) => throwError(() => this.mapError(err)))
    );
  }

  register(
    nombre: string,
    correo: string,
    contrasena: string,
    telefono: string,
    aceptaTerminos: boolean,
    aceptaPoliticaDatos: boolean
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, {
        nombre,
        correo,
        contrasena,
        telefono,
        aceptaTerminos,
        aceptaPoliticaDatos
      })
      .pipe(
        tap(res => this.storeSession(res)),
        catchError((err: HttpErrorResponse) => throwError(() => this.mapError(err)))
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.rol);
  }

  // Where to land right after login/register, based on the account's role.
  homeRouteFor(rol: UserRole): string {
    switch (rol) {
      case 'ADMIN':
        return '/admin';
      case 'OPERATOR':
        return '/operator';
      default:
        return '/client';
    }
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
  }

  private mapError(err: HttpErrorResponse): Error {
    // status 0 = no hubo respuesta: el mock API (puerto 3000) no está corriendo
    if (err.status === 0) return new Error('SERVER_UNAVAILABLE');
    if (err.status === 401) return new Error('INVALID_CREDENTIALS');
    if (err.status === 403) return new Error('ACCOUNT_DISABLED');
    if (err.status === 409) return new Error('EMAIL_TAKEN');
    if (err.status === 400) return new Error('TERMS_NOT_ACCEPTED');
    return new Error('UNKNOWN');
  }
}
