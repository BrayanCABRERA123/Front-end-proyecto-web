import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { PermissionView, RoleCode, RolePermissionsView } from '../../../core/services/role-permissions-api';

// ADR-015: los 3 roles son fijos (ya no se puede escribir un nombre ni crear/borrar un rol);
// lo único que este modal edita son los permisos de uno de los tres, elegido con un desplegable.
export interface CreateRoleData {
  roles: RolePermissionsView[];
  permissions: PermissionView[];
  initialRole: RoleCode;
}

export interface CreateRoleResult {
  role: RoleCode;
  permissionIds: number[];
}

const ROLE_OPTIONS: RoleCode[] = ['ADMIN', 'OPERATOR', 'CLIENT'];

@Component({
  selector: 'app-create-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './create-role-modal.html',
  styleUrl: './create-role-modal.scss'
})
export class CreateRoleModal {

  roleOptions = ROLE_OPTIONS;
  permissionsCatalog: PermissionView[];
  role: RoleCode;
  selectedIds = new Set<number>();

  constructor(
    private dialogRef: MatDialogRef<CreateRoleModal>,
    @Inject(MAT_DIALOG_DATA) private data: CreateRoleData,
  ) {
    this.permissionsCatalog = data.permissions;
    this.role = data.initialRole;
    this.applyRole(this.role);
  }

  // al cambiar el rol en el desplegable, se cargan los permisos que ya tiene ese rol
  onRoleChange(role: RoleCode): void {
    this.role = role;
    this.applyRole(role);
  }

  private applyRole(role: RoleCode): void {
    const current = this.data.roles.find(r => r.role === role);
    this.selectedIds = new Set(current?.permissionIds ?? []);
  }

  isChecked(permissionId: number): boolean {
    return this.selectedIds.has(permissionId);
  }

  toggle(permissionId: number): void {
    if (this.selectedIds.has(permissionId)) this.selectedIds.delete(permissionId);
    else this.selectedIds.add(permissionId);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    const result: CreateRoleResult = {
      role: this.role,
      permissionIds: [...this.selectedIds],
    };
    this.dialogRef.close(result);
  }
}
