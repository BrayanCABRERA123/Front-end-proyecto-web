import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AuthUser } from '../../../core/models/auth.models';
import { CreateUserViewModel } from '../../viewmodels/create-user.viewmodel';

// lo que devuelve el modal: la cuenta ya creada en el backend
export type CreateUserResult = AuthUser;

// el administrador crea una cuenta con uno de los 3 roles fijos (ADR-010);
// los datos y la creación están en CreateUserViewModel
@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  providers: [CreateUserViewModel],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.scss'
})
export class CreateUserModal {

  readonly vm = inject(CreateUserViewModel);
  private readonly dialogRef = inject(MatDialogRef<CreateUserModal>);

  showPassword = false;

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    this.vm.create(user => this.dialogRef.close(user));
  }
}
