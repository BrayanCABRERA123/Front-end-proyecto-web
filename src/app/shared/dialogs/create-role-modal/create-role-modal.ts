import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// lo que devuelve el modal cuando el admin le da "Crear Rol"
export interface CreateRoleResult {
  name: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-create-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './create-role-modal.html',
  styleUrl: './create-role-modal.scss'
})
export class CreateRoleModal {

  name = '';
  description = '';

  // arrancan igual que en el mockup: ver paneles y crear registros marcados de una
  permissions = {
    viewPanels: true,
    createRecords: true,
    editData: false,
    delete: false
  };

  constructor(private dialogRef: MatDialogRef<CreateRoleModal>) {}

  get canCreate(): boolean {
    return this.name.trim().length > 0;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    if (!this.canCreate) return;

    const selected: string[] = [];
    if (this.permissions.viewPanels) selected.push('view_panels');
    if (this.permissions.createRecords) selected.push('create_records');
    if (this.permissions.editData) selected.push('edit_data');
    if (this.permissions.delete) selected.push('delete');

    const result: CreateRoleResult = {
      name: this.name.trim(),
      description: this.description.trim(),
      permissions: selected
    };

    this.dialogRef.close(result);
  }
}
