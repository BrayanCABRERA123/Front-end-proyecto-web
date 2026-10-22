import { Injectable, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth';
import { apiErrorKey } from '../../core/utils/api-error';

// valida que la nueva sea distinta a la actual y que la confirmación coincida
function passwordsValidator(): ValidatorFn {
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

/** Cambiar la contraseña desde el perfil (security-service valida la actual y guarda la nueva). */
@Injectable()
export class ChangePasswordViewModel {

  private readonly auth = inject(AuthService);

  readonly form = inject(FormBuilder).nonNullable.group({
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
  }, { validators: passwordsValidator() });

  readonly saving = signal(false);
  readonly errorKey = signal<string | null>(null);

  // acceso rápido a los campos desde el HTML
  get f() {
    return this.form.controls;
  }

  get newPasswordValue(): string {
    return this.f.newPassword.value ?? '';
  }

  /** `changed` se llama cuando el servidor ya guardó la nueva (la vista cierra el modal) */
  submit(changed: () => void): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.saving()) return;

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.saving.set(true);
    this.errorKey.set(null);

    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        changed();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }
}
