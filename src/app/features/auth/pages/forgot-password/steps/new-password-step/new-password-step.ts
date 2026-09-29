import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
// lista reutilizable de requisitos de la contraseña
import { PasswordRequirementsComponent } from '../../../../../../shared/components/password-requirements/password-requirements';

import { AuthService } from '../../../../../../core/services/auth';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

@Component({
  selector: 'app-new-password-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, PasswordRequirementsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './new-password-step.html',
  styleUrl: './new-password-step.scss'
})
export class NewPasswordStepComponent {

  // correo y código confirmados en los pasos 1 y 2
  @Input() email: string = '';
  @Input() code: string = '';

  @Output() passwordUpdated = new EventEmitter<void>();

  saving = signal(false);
  errorKey = signal<string | null>(null);

  private readonly auth = inject(AuthService);

  newPassword: string = '';
  confirmPassword: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  get hasMinLength(): boolean { return this.newPassword.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.newPassword); }
  get hasNumber(): boolean { return /[0-9]/.test(this.newPassword); }
  get hasSpecialChar(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword); }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase &&
           this.hasNumber && this.hasSpecialChar;
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword &&
           this.confirmPassword !== '';
  }

  toggleNewPassword(): void { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    if (!this.isPasswordValid || !this.passwordsMatch || this.saving()) return;

    this.saving.set(true);
    this.errorKey.set(null);

    this.auth.resetPassword(this.email, this.code, this.newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordUpdated.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }
}
