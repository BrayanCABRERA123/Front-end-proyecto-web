import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

import { PasswordRequirementsComponent } from '../../components/password-requirements/password-requirements';

// campos de contraseña que se pueden mostrar / ocultar
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

// modal para cambiar la contraseña desde el perfil (cliente, operador y admin)
@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, ReactiveFormsModule, PasswordRequirementsComponent],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.scss'
})
export class ChangePasswordModal {

  form: FormGroup;

  // controla qué campos se muestran como texto
  visibleFields: Record<PasswordField, boolean> = {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ChangePasswordModal>
  ) {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          // mínimo 8 caracteres, una mayúscula, un número y un carácter especial
          Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
        ]
      ],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsValidator() });
  }

  // acceso rápido a los campos desde el HTML
  get f() {
    return this.form.controls;
  }

  get newPasswordValue(): string {
    return this.f['newPassword'].value ?? '';
  }

  // valida que la nueva sea distinta a la actual y que la confirmación coincida
  private passwordsValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const current = group.get('currentPassword')?.value;
      const newPassword = group.get('newPassword')?.value;
      const confirm = group.get('confirmPassword')?.value;

      const errors: ValidationErrors = {};

      if (current && newPassword && current === newPassword) {
        errors['samePassword'] = true;
      }

      if (confirm && newPassword !== confirm) {
        errors['notMatch'] = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  toggleVisibility(field: PasswordField): void {
    this.visibleFields[field] = !this.visibleFields[field];
  }

  // guarda y cierra el modal devolviendo true para que el perfil muestre el éxito
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // TODO: integrar con el backend (validar contraseña actual y actualizarla)
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
