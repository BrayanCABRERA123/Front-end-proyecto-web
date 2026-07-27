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

import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth';

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

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  // Lo llama el paso 1 cuando el usuario hace clic en "Enviar Código"
  // Pide el código de recuperación al service y avanza al paso 2
  onEmailSent(email: string): void {
    this.authService.solicitarRecuperacion(email).subscribe(() => {
      this.userEmail = email;
      this.currentStep = 2;
    });
  }

  // Lo llama el paso 2 cuando el usuario ingresó los 6 dígitos
  // Verifica el código contra el service y avanza al paso 3
  onCodeVerified(codigo: string): void {
    this.authService.verificarCodigo(this.userEmail, codigo).subscribe(esValido => {
      if (esValido) {
        this.currentStep = 3;
      }
    });
  }

  // Lo llama el paso 3 cuando el usuario define la nueva contraseña
  onPasswordUpdated(nuevaContrasena: string): void {
    this.authService.actualizarContrasena(this.userEmail, nuevaContrasena).subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}