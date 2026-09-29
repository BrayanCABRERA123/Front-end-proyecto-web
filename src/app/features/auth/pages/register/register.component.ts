import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
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

// registro real contra el security-service
import { AuthService } from '../../../../core/services/auth';
import { apiErrorKey } from '../../../../core/utils/api-error';


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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  registerForm: FormGroup;

  showPassword = false;
  showConfirmPassword = false;

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  loading = signal(false);
  errorKey = signal<string | null>(null);

  private readonly auth = inject(AuthService);


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {

    this.registerForm = this.fb.group({

      // cédula: la tabla security.person la exige y no puede repetirse
      documentNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{5,20}$')
        ]
      ],

      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@gmail\\.com$')
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern('^3[0-9]{9}$'),
          Validators.minLength(10),
          Validators.maxLength(10)
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          // mismas 4 reglas que muestra la lista de requisitos y que valida el backend
          Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/)
        ]
      ],

      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ],

      // el usuario debe aceptar explícitamente ambos documentos legales
      // (Ley 1581 de 2012 - Habeas Data: autorización previa, expresa e informada)
      acceptTerms: [false, Validators.requiredTrue],
      acceptDataPolicy: [false, Validators.requiredTrue]

    });

  }


  // abre el modal con el documento legal solicitado. Si el usuario da "Aceptar" dentro del modal,
  // marcamos la casilla correspondiente automáticamente (evita que tenga que aceptar dos veces).
  openLegalDocument(type: LegalDocumentType, event?: Event) {

    event?.preventDefault();

    const dialogRef = this.dialog.open(LegalDocumentModal, {
      panelClass: 'custom-dialog',
      data: { type, mode: 'accept' }
    });

    dialogRef.afterClosed().subscribe((accepted: boolean) => {

      if (!accepted) return;

      const control = type === 'terms' ? 'acceptTerms' : 'acceptDataPolicy';

      this.registerForm.get(control)?.setValue(true);
      this.registerForm.get(control)?.markAsTouched();
    });
  }


  // limpia los espacios si el usuario pega el correo
  stripEmailSpaces() {

    const email = this.registerForm.get('email')?.value;

    if (!email) return;

    this.registerForm
      .get('email')
      ?.setValue(email.replace(/\s/g, ''), { emitEvent: false });

  }

  // no permite escribir espacios en el correo
  blockSpaces(event: KeyboardEvent) {

    if (event.key === ' ') {
      event.preventDefault();
    }

  }

  sanitizePhone() {

    let phone = this.registerForm.get('phone')?.value;

    if (!phone) return;

    // elimina letras o símbolos
    phone = phone.replace(/\D/g, '');

    // obliga que empiece en 3 (celular colombiano)
    if (phone.length > 0 && phone[0] !== '3') {
      phone = phone.substring(1);
    }

    // limita a 10 números
    phone = phone.substring(0, 10);

    this.registerForm
      .get('phone')
      ?.setValue(phone, { emitEvent: false });

  }

  // la cédula solo admite dígitos (quita puntos, espacios y letras si la pegan)
  sanitizeDocument() {

    const documentNumber = this.registerForm.get('documentNumber')?.value;

    if (!documentNumber) return;

    this.registerForm
      .get('documentNumber')
      ?.setValue(documentNumber.replace(/\D/g, '').substring(0, 20), { emitEvent: false });

  }


  // acceso rápido a los campos desde el HTML
  get f() {
    return this.registerForm.controls;
  }

  // contraseña actual para la lista de requisitos (app-password-requirements)
  get password(): string {
    return this.registerForm.get('password')?.value || '';
  }


  validatePasswordsMatch() {

    const password = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('confirmPassword')?.value;

    if (password !== confirm) {

      this.registerForm
        .get('confirmPassword')
        ?.setErrors({ notMatch: true });

    }

  }


  onSubmit() {

    this.validatePasswordsMatch();

    if (this.registerForm.invalid || this.loading()) return;

    const value = this.registerForm.value;

    this.loading.set(true);
    this.errorKey.set(null);

    this.auth.register({
      documentNumber: value.documentNumber,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email,
      phone: value.phone || null,
      password: value.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.showRegisterSuccess();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });

  }


  // muestra el modal de registro exitoso y, al cerrarlo, redirige al login
  showRegisterSuccess() {

    const data: StatusModalData = {
      title: 'REGISTER.SUCCESS_TITLE',
      message: 'REGISTER.SUCCESS_MESSAGE',
      buttonText: 'REGISTER.SUCCESS_BUTTON'
    };

    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // evita que se cierre al hacer clic afuera o con ESC, así el usuario
      // siempre pasa por el botón y se garantiza la redirección
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe(() => {
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
