import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../../../../core/services/auth';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

@Component({
  selector: 'app-verification-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './verification-step.html',
  styleUrl: './verification-step.scss'
})
export class VerificationStepComponent {

  @Input() email: string = '';

  // emite el código ya confirmado por el servidor (el paso 3 lo necesita)
  @Output() codeVerified = new EventEmitter<string>();

  codeDigits: string[] = ['', '', '', '', '', ''];

  verifying = signal(false);
  errorKey = signal<string | null>(null);
  codeResent = signal(false);

  private readonly auth = inject(AuthService);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;

  onDigitInput(index: number, event: Event): void {

    const input = event.target as HTMLInputElement;

    // solo números, uno por casilla
    const value = input.value.replace(/\D/g, '').substring(0, 1);

    input.value = value;
    this.codeDigits[index] = value;

    // avanzar automáticamente a la siguiente casilla
    if (value && index < this.codeDigits.length - 1) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }

  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      this.digitInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onVerify(): void {
    const fullCode = this.codeDigits.join('');

    if (fullCode.length !== 6 || this.verifying()) return;

    this.verifying.set(true);
    this.errorKey.set(null);

    this.auth.verifyResetCode(this.email, fullCode).subscribe({
      next: () => {
        this.verifying.set(false);
        this.codeVerified.emit(fullCode);
      },
      error: (error: unknown) => {
        this.verifying.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }

  // pide un código nuevo: el anterior deja de servir
  onResend(event: Event): void {
    event.preventDefault();

    this.errorKey.set(null);
    this.codeResent.set(false);

    this.auth.requestPasswordReset(this.email).subscribe({
      next: () => this.codeResent.set(true),
      error: (error: unknown) => this.errorKey.set(apiErrorKey(error))
    });
  }

  // validación para que permita solo números
  handleKeyDown(index: number, event: KeyboardEvent): void {

    const key = event.key;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];

    // bloquear letras y símbolos
    if (!/^[0-9]$/.test(key) && !allowedKeys.includes(key)) {
      event.preventDefault();
      return;
    }

    // retroceder con backspace
    if (key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      this.digitInputs.toArray()[index - 1].nativeElement.focus();
    }

  }
}
