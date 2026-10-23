import { Component, ViewChildren, QueryList, ElementRef, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';

// paso 2: las 6 casillas del código (el foco salta solo); confirmar y reenviar los hace el ViewModel
@Component({
  selector: 'app-verification-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './verification-step.html',
  styleUrl: './verification-step.scss'
})
export class VerificationStepComponent {

  readonly vm = inject(ForgotPasswordViewModel);

  codeDigits: string[] = ['', '', '', '', '', ''];

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

  onVerify(): void {
    this.vm.verify(this.codeDigits.join(''));
  }

  // pide un código nuevo: el anterior deja de servir
  onResend(event: Event): void {
    event.preventDefault();
    this.vm.resend();
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
