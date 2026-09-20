import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface CreateUserResult {
  name: string;
  email: string;
  role: string;
  invite: boolean;
}

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

  constructor(private dialogRef: MatDialogRef<CreateUserModal>) {}

  get canCreate(): boolean {
    return this.name.trim().length > 0 && this.email.trim().includes('@');
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    if (!this.canCreate) return;

    const result: CreateUserResult = {
      name: this.name.trim(),
      email: this.email.trim(),
      role: this.role,
      invite: this.invite
    };

    this.dialogRef.close(result);
  }
}
