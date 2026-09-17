import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap, throwError } from 'rxjs';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  iniciales: string;
  rol: 'CLIENTE' | 'OPERARIO' | 'ADMIN';
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private baseUrl = 'http://localhost:3000';
  private tokenKey = 'accessToken';
  private userKey = 'usuario';

  constructor(private http: HttpClient) {}

  // MOCK JWT for demo purposes only (mock-api/server.cjs) — replace baseUrl and this flow once the real auth backend exists.
  login(correo: string, contrasena: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { correo, contrasena }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.accessToken);
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
      })
    );
  }

  // MOCK register: checks for a duplicate email against json-server, then creates the user.
  // The real backend will hash the password and validate server-side — this is demo-only.
  register(nombre: string, correo: string, contrasena: string): Observable<AuthUser> {
    return this.http.get<AuthUser[]>(`${this.baseUrl}/users`, { params: { correo } }).pipe(
      switchMap(existentes => {
        if (existentes.length > 0) {
          return throwError(() => new Error('EMAIL_TAKEN'));
        }

        const iniciales = nombre
          .trim()
          .split(/\s+/)
          .map(parte => parte[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return this.http.post<AuthUser>(`${this.baseUrl}/users`, {
          nombre,
          correo,
          contrasena,
          iniciales,
          rol: 'CLIENTE'
        });
      })
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
    return !!this.getToken();
  }
}
