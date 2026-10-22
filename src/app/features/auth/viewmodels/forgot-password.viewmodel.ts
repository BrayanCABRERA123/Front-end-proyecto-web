import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth';
import { apiErrorKey } from '../../../core/utils/api-error';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

/**
 * Recuperar la contraseña en 3 pasos (security-service): pedir el código al correo, confirmarlo y
 * poner la contraseña nueva. Lo comparten la pantalla y sus 3 pasos.
 */
@Injectable()
export class ForgotPasswordViewModel {

  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);

  // paso que se muestra, empieza en 1
  readonly step = signal(1);
  readonly errorKey = signal<string | null>(null);

  // paso 1: el correo se muestra en el paso 2 y se reenvía en el paso 3
  readonly email = signal('');
  readonly sending = signal(false);
  readonly isEmailInvalid = computed(() => !!this.email() && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email()));

  // paso 2: el código ya confirmado lo envía el paso 3 junto con la contraseña nueva
  readonly verifying = signal(false);
  readonly codeResent = signal(false);
  private verifiedCode = '';

  // paso 3
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly saving = signal(false);
  readonly hasMinLength = computed(() => this.newPassword().length >= 8);
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.newPassword()));
  readonly hasNumber = computed(() => /[0-9]/.test(this.newPassword()));
  readonly hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword()));
  readonly isPasswordValid = computed(() => this.hasMinLength() && this.hasUppercase() && this.hasNumber() && this.hasSpecialChar());
  readonly passwordsMatch = computed(() => this.newPassword() === this.confirmPassword() && this.confirmPassword() !== '');

  stripEmailSpaces(): void {
    this.email.update(email => email.replace(/\s/g, ''));
  }

  // el servidor responde igual exista o no la cuenta (no revela correos registrados),
  // así que siempre se avanza al paso 2 si la petición llegó bien
  requestCode(): void {
    const email = this.email().trim();
    if (!email || this.isEmailInvalid() || this.sending()) return;
    this.sending.set(true);
    this.errorKey.set(null);
    this.auth.requestPasswordReset(email).subscribe({
      next: () => {
        this.sending.set(false);
        this.email.set(email);
        this.step.set(2);
        this.feedback.info('AUTH_FEEDBACK.CODE_SENT_TITLE', 'AUTH_FEEDBACK.CODE_SENT_MESSAGE', {
          messageParams: { email },
          icon: 'mark_email_read',
          buttonText: 'AUTH_FEEDBACK.OK'
        });
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.feedback.error('AUTH_FEEDBACK.ERROR_TITLE', apiErrorKey(error), { buttonText: 'AUTH_FEEDBACK.OK' });
      }
    });
  }

  verify(code: string): void {
    if (code.length !== 6 || this.verifying()) return;
    this.verifying.set(true);
    this.errorKey.set(null);
    this.auth.verifyResetCode(this.email(), code).subscribe({
      next: () => {
        this.verifying.set(false);
        this.verifiedCode = code;
        this.errorKey.set(null);
        this.step.set(3);
      },
      error: (error: unknown) => {
        this.verifying.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.feedback.error('AUTH_FEEDBACK.CODE_ERROR_TITLE', apiErrorKey(error), { buttonText: 'AUTH_FEEDBACK.OK' });
      }
    });
  }

  // pide un código nuevo: el anterior deja de servir
  resend(): void {
    this.errorKey.set(null);
    this.codeResent.set(false);
    this.auth.requestPasswordReset(this.email()).subscribe({
      next: () => {
        this.codeResent.set(true);
        this.feedback.info('AUTH_FEEDBACK.CODE_RESENT_TITLE', 'FORGOT.VERIFICATION.RESENT', {
          icon: 'mark_email_read',
          buttonText: 'AUTH_FEEDBACK.OK'
        });
      },
      error: (error: unknown) => {
        this.errorKey.set(apiErrorKey(error));
        this.feedback.error('AUTH_FEEDBACK.ERROR_TITLE', apiErrorKey(error), { buttonText: 'AUTH_FEEDBACK.OK' });
      }
    });
  }

  /** guarda la contraseña nueva; `updated` se llama cuando security-service la aceptó */
  resetPassword(updated: () => void): void {
    if (!this.isPasswordValid() || !this.passwordsMatch() || this.saving()) return;
    this.saving.set(true);
    this.errorKey.set(null);
    this.auth.resetPassword(this.email(), this.verifiedCode, this.newPassword()).subscribe({
      next: () => {
        this.saving.set(false);
        updated();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
        // ej. SAME_PASSWORD: la nueva contraseña no puede ser la que ya tenía
        this.feedback.error('AUTH_FEEDBACK.PASSWORD_ERROR_TITLE', apiErrorKey(error), { buttonText: 'AUTH_FEEDBACK.OK' });
      }
    });
  }
}
