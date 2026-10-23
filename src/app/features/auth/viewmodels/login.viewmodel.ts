import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth';
import { AuthUser } from '../../../core/models/auth.models';
import { apiErrorCode, apiErrorKey } from '../../../core/utils/api-error';
import { allowedEmailValidator } from '../../../core/utils/email';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

/** Inicio de sesión: el formulario, el envío a security-service y los avisos de error. */
@Injectable()
export class LoginViewModel {

  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);

  readonly form = inject(FormBuilder).group({
    email: ['', [Validators.required, allowedEmailValidator()]],
    password: ['', Validators.required]
  });

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  readonly loading = signal(false);
  readonly errorKey = signal<string | null>(null);

  get f() {
    return this.form.controls;
  }

  stripEmailSpaces(): void {
    const email = this.form.controls.email;
    email.setValue((email.value ?? '').replace(/\s/g, ''), { emitEvent: false });
  }

  /** entra con el correo y la contraseña; `loggedIn` recibe el usuario (la vista navega) */
  submit(loggedIn: (user: AuthUser) => void): void {
    if (this.form.invalid || this.loading()) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorKey.set(null);
    this.auth.login(email ?? '', password ?? '').subscribe({
      next: loggedIn,
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.showLoginError(error);
      }
    });
  }

  // vuelve a la página que pidió antes del login si es de su área; si no, al inicio de su rol
  homeTarget(user: AuthUser, returnUrl: string | null): string {
    const home = this.auth.homeRoute(user);
    return returnUrl?.startsWith(home) ? returnUrl : home;
  }

  welcome(user: AuthUser): void {
    this.feedback.success('AUTH_FEEDBACK.LOGIN_SUCCESS_TITLE', 'AUTH_FEEDBACK.LOGIN_SUCCESS_MESSAGE', {
      messageParams: { name: `${user.firstName} ${user.lastName}`.trim() },
      icon: 'verified_user'
    });
  }

  // 5 intentos fallidos bloquean la cuenta 15 minutos: se avisa con su propio título
  private showLoginError(error: unknown): void {
    if (apiErrorCode(error) === 'ACCOUNT_LOCKED') {
      this.feedback.error('AUTH_FEEDBACK.LOCKED_TITLE', apiErrorKey(error), { icon: 'lock_clock', buttonText: 'AUTH_FEEDBACK.OK' });
      return;
    }
    this.feedback.error('AUTH_FEEDBACK.LOGIN_ERROR_TITLE', apiErrorKey(error), { icon: 'no_accounts', buttonText: 'AUTH_FEEDBACK.OK' });
  }
}
