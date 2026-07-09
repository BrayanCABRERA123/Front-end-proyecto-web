import { Component, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-new-password-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './new-password-step.html',
  styleUrl: './new-password-step.scss'
})
export class NewPasswordStepComponent {

  @Output() passwordUpdated = new EventEmitter<void>();

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
    if (this.isPasswordValid && this.passwordsMatch) {
      this.passwordUpdated.emit();
    }
  }
}