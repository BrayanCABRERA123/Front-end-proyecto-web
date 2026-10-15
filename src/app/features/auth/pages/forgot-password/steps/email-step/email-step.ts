import { Component, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../../../../core/services/auth';
import { apiErrorKey } from '../../../../../../core/utils/api-error';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';


@Component({
  selector: 'app-email-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './email-step.html',
  styleUrl: './email-step.scss'
})
export class EmailStepComponent {

  email: string = '';

  sending = signal(false);
  errorKey = signal<string | null>(null);

  private readonly auth = inject(AuthService);
  private readonly feedback = inject(FeedbackService);

  @Output() emailSent = new EventEmitter<string>();

  // el servidor responde igual exista o no la cuenta (no revela correos registrados),
  // así que siempre avanzamos al paso 2 si la petición llegó bien
  onSubmit(): void {
    const email = this.email.trim();

    if (!email || this.isEmailInvalid || this.sending()) return;

    this.sending.set(true);
    this.errorKey.set(null);

    this.auth.requestPasswordReset(email).subscribe({
      next: () => {
        this.sending.set(false);
        this.emailSent.emit(email);
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

  get isEmailInvalid(): boolean {
    if (!this.email) return false;

    return !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email);
  }

  stripEmailSpaces() {

    if (!this.email) return;

    this.email = this.email.replace(/\s/g, '');

  }

  blockSpaces(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }
}
