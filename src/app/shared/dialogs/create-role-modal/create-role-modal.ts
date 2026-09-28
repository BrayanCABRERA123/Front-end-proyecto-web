import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// si llegan datos, el modal está en modo edición y arranca con esos valores
export interface CreateRoleData {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
}

// lo que devuelve el modal cuando el admin confirma
export interface CreateRoleResult {
  id?: string;
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

  editing = false;
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<CreateRoleModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: CreateRoleData | null,
  ) {
    if (data) {
      this.editing = true;
      this.name = data.name;
      this.description = data.description;
      this.permissions.viewPanels = this.has('view_panels');
      this.permissions.createRecords = this.has('create_records');
      this.permissions.editData = this.has('edit_data');
      this.permissions.delete = this.has('delete');
    }
  }

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 3;
  }

  get canCreate(): boolean {
    return this.name.trim().length >= 3;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    this.submitted = true;
    if (!this.canCreate) return;

    const selected: string[] = [];
    if (this.permissions.viewPanels) selected.push('view_panels');
    if (this.permissions.createRecords) selected.push('create_records');
    if (this.permissions.editData) selected.push('edit_data');
    if (this.permissions.delete) selected.push('delete');

    const result: CreateRoleResult = {
      id: this.data?.id,
      name: this.name.trim(),
      description: this.description.trim(),
      permissions: selected
    };

    this.dialogRef.close(result);
  }

  private has(permission: string): boolean {
    return (this.data?.permissions ?? []).includes(permission);
  }
}