import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button';
import { AuthSidePanelComponent } from '../../../../shared/components/auth-side-panel/auth-side-panel';
// lista reutilizable de requisitos de la contraseña
import { PasswordRequirementsComponent } from '../../../../shared/components/password-requirements/password-requirements';
// modal reutilizable para mostrar Términos y Condiciones / Política de Datos
import { LegalDocumentModal, LegalDocumentType } from '../../../../shared/dialogs/legal-document-modal/legal-document-modal';
// modal reutilizable para mostrar el mensaje de registro exitoso
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
import { RegisterViewModel } from '../../viewmodels/register.viewmodel';

// vista del registro: el formulario y el envío están en RegisterViewModel; aquí quedan mostrar u
// ocultar la contraseña, los documentos legales y el aviso final
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    BackButtonComponent,
    AuthSidePanelComponent,
    PasswordRequirementsComponent
  ],
  providers: [RegisterViewModel],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  readonly vm = inject(RegisterViewModel);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  showPassword = false;
  showConfirmPassword = false;

  // abre el documento legal; si da "Aceptar" dentro del modal se marca su casilla
  openLegalDocument(type: LegalDocumentType, event?: Event) {
    event?.preventDefault();
    this.dialog.open(LegalDocumentModal, { panelClass: 'custom-dialog', data: { type, mode: 'accept' } })
      .afterClosed()
      .subscribe((accepted: boolean) => {
        if (accepted) this.vm.acceptDocument(type);
      });
  }

  // no permite escribir espacios en el correo
  blockSpaces(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  onSubmit() {
    this.vm.submit(() => this.showRegisterSuccess());
  }

  // muestra el modal de registro exitoso y, al cerrarlo, redirige al login
  private showRegisterSuccess() {
    const data: StatusModalData = {
      title: 'REGISTER.SUCCESS_TITLE',
      message: 'REGISTER.SUCCESS_MESSAGE',
      buttonText: 'REGISTER.SUCCESS_BUTTON'
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
