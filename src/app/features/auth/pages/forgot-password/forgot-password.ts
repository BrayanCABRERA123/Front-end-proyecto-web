import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// componentes compartidos
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card';
import { StepperComponent } from '../../../../shared/components/stepper/stepper';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';
import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';

// los 3 pasos
import { EmailStepComponent } from './steps/email-step/email-step';
import { VerificationStepComponent } from './steps/verification-step/verification-step';
import { NewPasswordStepComponent } from './steps/new-password-step/new-password-step';

// modal reutilizable para mostrar el mensaje de contraseña actualizada
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
import { ForgotPasswordViewModel } from '../../viewmodels/forgot-password.viewmodel';

// vista de recuperar contraseña: el flujo está en ForgotPasswordViewModel, que comparten los 3 pasos
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AuthCardComponent,         // tarjeta blanca contenedora
    StepperComponent,          // indicador de pasos 1-2-3
    EmailStepComponent,        // paso 1
    VerificationStepComponent, // paso 2
    NewPasswordStepComponent,  // paso 3
    BackButtonComponent,
    AuthSidePanelComponent
  ],
  providers: [ForgotPasswordViewModel],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {

  readonly vm = inject(ForgotPasswordViewModel);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // terminó el paso 3: muestra el modal de éxito y, al cerrarlo, redirige al login
  onPasswordUpdated(): void {
    const data: StatusModalData = {
      title: 'FORGOT.NEW_PASSWORD.SUCCESS_TITLE',
      message: 'FORGOT.NEW_PASSWORD.SUCCESS_MESSAGE',
      buttonText: 'FORGOT.NEW_PASSWORD.SUCCESS_BUTTON'
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // evita que se cierre al hacer clic afuera o con ESC, así el usuario
      // siempre pasa por el botón y se garantiza la redirección
      disableClose: true,
      data
    }).afterClosed().subscribe(() => {
      // el login está en la ruta vacía del módulo auth, es decir "/auth"
      this.router.navigate(['/auth']);
    });
  }
}
