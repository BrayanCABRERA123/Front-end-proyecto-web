import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

// registro real contra el security-service
import { AuthService } from '../../../core/services/auth';
import { apiErrorKey } from '../../../core/utils/api-error';
import { allowedEmailValidator } from '../../../core/utils/email';
import { LegalDocumentType } from '../../../shared/dialogs/legal-document-modal/legal-document-modal';

/** Registro de un cliente: el formulario, sus limpiezas y el envío a security-service. */
@Injectable()
export class RegisterViewModel {

  private readonly auth = inject(AuthService);

  readonly form = inject(FormBuilder).group({
    // cédula: la tabla security.person la exige y no puede repetirse
    documentNumber: ['', [Validators.required, Validators.pattern('^[0-9]{5,20}$')]],
    firstName: ['', [Validators.required, Validators.minLength(3)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, allowedEmailValidator()]],
    phone: ['', [Validators.required, Validators.pattern('^3[0-9]{9}$'), Validators.minLength(10), Validators.maxLength(10)]],
    // mismas 4 reglas que muestra la lista de requisitos y que valida el backend
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/)]],
    confirmPassword: ['', [Validators.required]],
    // el usuario debe aceptar explícitamente ambos documentos legales
    // (Ley 1581 de 2012 - Habeas Data: autorización previa, expresa e informada)
    acceptTerms: [false, Validators.requiredTrue],
    acceptDataPolicy: [false, Validators.requiredTrue]
  });

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  readonly loading = signal(false);
  readonly errorKey = signal<string | null>(null);

  // acceso rápido a los campos desde el HTML
  get f() {
    return this.form.controls;
  }

  // contraseña actual para la lista de requisitos (app-password-requirements)
  get password(): string {
    return this.form.controls.password.value || '';
  }

  // aceptar dentro del modal del documento marca su casilla (no tiene que aceptar dos veces)
  acceptDocument(type: LegalDocumentType): void {
    const control = type === 'terms' ? this.form.controls.acceptTerms : this.form.controls.acceptDataPolicy;
    control.setValue(true);
    control.markAsTouched();
  }

  // limpia los espacios si el usuario pega el correo
  stripEmailSpaces(): void {
    const email = this.form.controls.email;
    if (email.value) email.setValue(email.value.replace(/\s/g, ''), { emitEvent: false });
  }

  // solo dígitos, empieza en 3 (celular colombiano) y máximo 10 números
  sanitizePhone(): void {
    const control = this.form.controls.phone;
    let phone = control.value;
    if (!phone) return;
    phone = phone.replace(/\D/g, '');
    if (phone.length > 0 && phone[0] !== '3') {
      phone = phone.substring(1);
    }
    control.setValue(phone.substring(0, 10), { emitEvent: false });
  }

  // la cédula solo admite dígitos (quita puntos, espacios y letras si la pegan)
  sanitizeDocument(): void {
    const control = this.form.controls.documentNumber;
    if (control.value) control.setValue(control.value.replace(/\D/g, '').substring(0, 20), { emitEvent: false });
  }

  validatePasswordsMatch(): void {
    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.form.controls.confirmPassword.setErrors({ notMatch: true });
    }
  }

  /** crea la cuenta; `registered` se llama cuando security-service la guardó */
  submit(registered: () => void): void {
    this.validatePasswordsMatch();
    if (this.form.invalid || this.loading()) return;

    const value = this.form.getRawValue();
    this.loading.set(true);
    this.errorKey.set(null);
    this.auth.register({
      documentNumber: value.documentNumber ?? '',
      firstName: (value.firstName ?? '').trim(),
      lastName: (value.lastName ?? '').trim(),
      email: value.email ?? '',
      phone: value.phone || null,
      password: value.password ?? '',
      acceptsTerms: value.acceptTerms === true,
      acceptsDataPolicy: value.acceptDataPolicy === true
    }).subscribe({
      next: () => {
        this.loading.set(false);
        registered();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }
}
