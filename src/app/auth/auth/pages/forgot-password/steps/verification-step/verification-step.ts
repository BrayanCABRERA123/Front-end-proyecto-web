import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import 'iconify-icon';

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
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      this.codeDigits[index] = '';
      return;
    }

    this.codeDigits[index] = value.slice(-1);

    if (value && index < 5) {
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
}