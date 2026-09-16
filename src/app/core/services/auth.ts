import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
