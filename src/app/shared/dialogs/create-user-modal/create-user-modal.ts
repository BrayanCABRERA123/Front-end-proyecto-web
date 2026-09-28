import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// si llegan datos, el modal está en modo edición y arranca con esos valores
export interface CreateUserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  invite: boolean;
}

export interface CreateUserResult {
  id?: string;
  name: string;
  email: string;
  role: string;
  invite: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.scss'
})
export class CreateUserModal {

  // roles disponibles para asignar (coinciden con los que ya existen en Roles)
  roleOptions = ['Administrador', 'Supervisor de Bahía', 'Soporte'];

  name = '';
  email = '';
  role = 'Administrador';
  invite = true;

  editing = false;
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<CreateUserModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: CreateUserData | null,
  ) {
    if (data) {
      this.editing = true;
      this.name = data.name;
      this.email = data.email;
      this.role = data.role;
      this.invite = data.invite;
    }
  }

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 3;
  }

  // la validación tiene que ser razonable y entendible por cualquier persona
  get emailInvalid(): boolean {
    return this.submitted && !EMAIL_RE.test(this.email.trim());
  }

  get canCreate(): boolean {
    return this.name.trim().length >= 3 && EMAIL_RE.test(this.email.trim());
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    this.submitted = true;
    if (!this.canCreate) return;

    const result: CreateUserResult = {
      id: this.data?.id,
      name: this.name.trim(),
      email: this.email.trim(),
      role: this.role,
      invite: this.invite
    };

    this.dialogRef.close(result);
  }
}