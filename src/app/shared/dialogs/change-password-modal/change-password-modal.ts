import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

import { PasswordRequirementsComponent } from '../../components/password-requirements/password-requirements';
import { ChangePasswordViewModel } from '../../viewmodels/change-password.viewmodel';

// campos de contraseña que se pueden mostrar / ocultar
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

// modal para cambiar la contraseña desde el perfil (cliente, operador y admin);
// el formulario y el guardado están en ChangePasswordViewModel
@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, ReactiveFormsModule, PasswordRequirementsComponent],
  providers: [ChangePasswordViewModel],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.scss'
})
export class ChangePasswordModal {

  readonly vm = inject(ChangePasswordViewModel);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordModal>);

  // controla qué campos se muestran como texto
  visibleFields: Record<PasswordField, boolean> = {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  };

  toggleVisibility(field: PasswordField): void {
    this.visibleFields[field] = !this.visibleFields[field];
  }

  // cierra el modal devolviendo true para que el perfil muestre el éxito
  onSubmit(): void {
    this.vm.submit(() => this.dialogRef.close(true));
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
