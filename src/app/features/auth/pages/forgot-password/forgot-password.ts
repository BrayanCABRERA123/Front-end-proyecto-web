import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Importamos los componentes compartidos
import { AuthCardComponent } from '../../../../shared/components/auth-card/auth-card';
import { StepperComponent } from '../../../../shared/components/stepper/stepper';

// Importamos los 3 pasos hijos
import { EmailStepComponent } from './steps/email-step/email-step';
import { VerificationStepComponent } from './steps/verification-step/verification-step';
import { NewPasswordStepComponent } from './steps/new-password-step/new-password-step';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';

import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AuthCardComponent,        // tarjeta blanca contenedora
    StepperComponent,         // indicador de pasos 1-2-3
    EmailStepComponent,       // paso 1
    VerificationStepComponent, // paso 2
    NewPasswordStepComponent,  // paso 3
    BackButtonComponent,
    AuthSidePanelComponent
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {

  // Controla qué paso se muestra, empieza en 1
  currentStep: number = 1;

  // Guarda el email del paso 1 para mostrarlo en el paso 2
  userEmail: string = '';

  // Lo llama el paso 1 cuando el usuario hace clic en "Enviar Código"
  // Recibe el email y avanza al paso 2
  onEmailSent(email: string): void {
    this.userEmail = email;
    this.currentStep = 2;
  }

  // Lo llama el paso 2 cuando el código es correcto
  // Avanza al paso 3
  onCodeVerified(): void {
    this.currentStep = 3;
  }

  // Lo llama el paso 3 cuando la contraseña se actualizó
  // Aquí después conectarías con el router para ir al login
  onPasswordUpdated(): void {
    console.log('Contraseña actualizada — navegar al login');
    // Después agregarías: this.router.navigate(['/login']);
  }
}