import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

// lista reutilizable de requisitos de la contraseña
import { PasswordRequirementsComponent } from '../../../../../../shared/components/password-requirements/password-requirements';
import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';

// paso 3: la contraseña nueva; las reglas y el guardado están en ForgotPasswordViewModel
@Component({
  selector: 'app-new-password-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, PasswordRequirementsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './new-password-step.html',
  styleUrl: './new-password-step.scss'
})
export class NewPasswordStepComponent {

  readonly vm = inject(ForgotPasswordViewModel);

  // el padre muestra el aviso de éxito y lleva al login
  @Output() passwordUpdated = new EventEmitter<void>();

  showNewPassword = false;
  showConfirmPassword = false;

  toggleNewPassword(): void { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit(): void {
    this.vm.resetPassword(() => this.passwordUpdated.emit());
  }
}
