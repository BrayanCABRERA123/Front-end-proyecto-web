import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-verification-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './verification-step.html',
  styleUrl: './verification-step.scss'
})
export class VerificationStepComponent {

  @Input() email: string = '';
  @Output() codeVerified = new EventEmitter<void>();

  codeDigits: string[] = ['', '', '', '', '', ''];

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;

  onDigitInput(index: number, event: Event): void {

    const input = event.target as HTMLInputElement;

    // eliminar todo lo que no sea número
    let value = input.value.replace(/\D/g, '');

    // permitir solo un carácter
    value = value.substring(0, 1);

    // actualizar input visual
    input.value = value;

    // actualizar array
    this.codeDigits[index] = value;

    // avanzar automáticamente
    if (value && index < this.codeDigits.length - 1) {

      const inputs = this.digitInputs.toArray();

      inputs[index + 1].nativeElement.focus();

    }

  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      const inputs = this.digitInputs.toArray();
      inputs[index - 1].nativeElement.focus();
    }
  }

  onVerify(): void {
    const fullCode = this.codeDigits.join('');
    if (fullCode.length === 6) {
      this.codeVerified.emit();
    }
  }

  // Validacion para que permita solo numeros
  handleKeyDown(index: number, event: KeyboardEvent): void {

    const tecla = event.key;

    const teclasPermitidas = [
      'Backspace',
      'ArrowLeft',
      'ArrowRight',
      'Tab'
    ];

    // bloquear letras y símbolos
    if (!/^[0-9]$/.test(tecla) && !teclasPermitidas.includes(tecla)) {
      event.preventDefault();
      return;
    }

    // retroceder con backspace
    if (tecla === 'Backspace' && !this.codeDigits[index] && index > 0) {

      const inputs = this.digitInputs.toArray();

      inputs[index - 1].nativeElement.focus();

    }

  }
}