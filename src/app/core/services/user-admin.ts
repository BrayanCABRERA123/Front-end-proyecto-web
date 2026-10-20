import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { AuthUser, CreateUserAccountRequest, PageResponse, UserRole } from '../models/auth.models';

// gestión de cuentas que hace el administrador contra el security-service (/api/v1/admin/users).
// el backend exige el rol ADMIN en el token; si otro rol lo intenta, responde 403.
@Injectable({
  providedIn: 'root',
})
export class UserAdminService {

  private readonly http = inject(HttpClient);

  // crea una cuenta con la que el usuario ya puede iniciar sesión (ej. un operario nuevo)
  createAccount(request: CreateUserAccountRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE_URL}/admin/users`, request);
  }

  // lista las cuentas reales, opcionalmente solo las de un rol
  listAccounts(page = 0, size = 100, role?: UserRole): Observable<PageResponse<AuthUser>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (role) params = params.set('role', role);
    return this.http.get<PageResponse<AuthUser>>(`${API_BASE_URL}/admin/users`, { params });
  }

  // activa o desactiva una cuenta; al desactivarla, el backend también cierra sus sesiones
  setActive(userId: number, active: boolean): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${API_BASE_URL}/admin/users/${userId}/status`, { active });
  }
}
