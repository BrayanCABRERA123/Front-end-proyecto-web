import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

export type RoleCode = 'ADMIN' | 'OPERATOR' | 'CLIENT';

export interface PermissionView {
  id: number;
  code: string;
  name: string;
  resource: string;
  action: string;
}

export interface RolePermissionsView {
  role: RoleCode;
  permissionIds: number[];
}

export interface RolePermissionsMatrix {
  permissions: PermissionView[];
  roles: RolePermissionsView[];
}

// permisos de los 3 roles fijos (admin, Gestión > Roles) contra el security-service
// (/admin/roles-permissions). ADR-015: los roles son fijos (ADMIN/OPERATOR/CLIENT), solo sus
// permisos se editan; no hay crear ni borrar rol.
@Injectable({ providedIn: 'root' })
export class RolePermissionsApiService {

  private readonly http = inject(HttpClient);

  matrix(): Observable<RolePermissionsMatrix> {
    return this.http.get<RolePermissionsMatrix>(`${API_BASE_URL}/admin/roles-permissions`);
  }

  update(role: RoleCode, permissionIds: number[]): Observable<RolePermissionsView> {
    return this.http.put<RolePermissionsView>(`${API_BASE_URL}/admin/roles-permissions/${role}`, { permissionIds });
  }
}
