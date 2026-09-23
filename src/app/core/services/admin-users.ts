import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { UserRole } from './auth';

// Cuentas del personal (administradores y operarios) — pestaña Usuarios de Gestión.
// Los clientes no aparecen aquí: se registran solos desde /register.
export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  roleName: string;
  operatorId: string | null; // OP-n cuando es operario (enlaza con /admin/operators/:id)
  specialty: string | null;
  dateAdded: string; // yyyy-mm-dd
  status: 'active' | 'disabled';
}

export interface StaffRole {
  code: UserRole;
  name: string;
}

export interface NewStaffUser {
  nombre: string;
  correo: string;
  telefono?: string;
  contrasena: string;
  rol: UserRole;
  specialty?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private api: Api) {}

  list$(): Observable<StaffUser[]> {
    return this.api.get<StaffUser[]>('admin/users');
  }

  roles$(): Observable<StaffRole[]> {
    return this.api.get<StaffRole[]>('admin/roles');
  }

  // Si es operario, el mock también crea su ficha y un horario base Lun-Vie 08:00-17:00.
  create$(user: NewStaffUser): Observable<StaffUser> {
    return this.api.post<StaffUser>('admin/users', user);
  }

  setActive$(id: number, isActive: boolean): Observable<StaffUser> {
    return this.api.patch<StaffUser>(`admin/users/${id}`, { isActive });
  }

  remove$(id: number): Observable<void> {
    return this.api.delete<void>(`admin/users/${id}`);
  }
}
