import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// la cuenta se crea de verdad en el security-service
import { UserAdminService } from '../../../core/services/user-admin';
import { AuthUser, UserRole } from '../../../core/models/auth.models';
import { apiErrorKey } from '../../../core/utils/api-error';

// lo que devuelve el modal: la cuenta ya creada en el backend
export type CreateUserResult = AuthUser;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOCUMENT_RE = /^[0-9]{5,20}$/;
// mismas 4 reglas que el backend: 8+ caracteres, mayúscula, número y carácter especial
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])\S{8,72}$/;

// el administrador crea una cuenta con uno de los 3 roles fijos (ADR-010)
// y una contraseña temporal que el usuario puede cambiar desde su perfil
@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.scss'
})
export class CreateUserModal {

  // los 3 roles del sistema (security.role)
  readonly roleOptions: { value: UserRole; labelKey: string }[] = [
    { value: 'ADMIN', labelKey: 'PROFILE.ROLE.ADMIN' },
    { value: 'OPERATOR', labelKey: 'PROFILE.ROLE.OPERATOR' },
    { value: 'CLIENT', labelKey: 'PROFILE.ROLE.CLIENT' }
  ];

  documentNumber = '';
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  role: UserRole = 'OPERATOR';
  showPassword = false;

  submitted = false;

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  saving = signal(false);
  errorKey = signal<string | null>(null);

  private readonly userAdmin = inject(UserAdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(private dialogRef: MatDialogRef<CreateUserModal>) {}

  get documentInvalid(): boolean {
    return this.submitted && !DOCUMENT_RE.test(this.documentNumber.trim());
  }

  get firstNameInvalid(): boolean {
    return this.submitted && this.firstName.trim().length < 2;
  }

  get lastNameInvalid(): boolean {
    return this.submitted && this.lastName.trim().length < 2;
  }

  // la validación tiene que ser razonable y entendible por cualquier persona
  get emailInvalid(): boolean {
    return this.submitted && !EMAIL_RE.test(this.email.trim());
  }

  get passwordInvalid(): boolean {
    return this.submitted && !PASSWORD_RE.test(this.password);
  }

  get canCreate(): boolean {
    return DOCUMENT_RE.test(this.documentNumber.trim())
      && this.firstName.trim().length >= 2
      && this.lastName.trim().length >= 2
      && EMAIL_RE.test(this.email.trim())
      && PASSWORD_RE.test(this.password);
  }

  // la cédula solo admite dígitos (quita puntos y espacios si la pegan)
  sanitizeDocument(): void {
    this.documentNumber = this.documentNumber.replace(/\D/g, '').substring(0, 20);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  create(): void {
    this.submitted = true;
    if (!this.canCreate || this.saving()) return;

    this.saving.set(true);
    this.errorKey.set(null);

    this.userAdmin.createAccount({
      documentNumber: this.documentNumber.trim(),
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || null,
      password: this.password,
      roles: [this.role]
    }).subscribe({
      next: user => {
        this.saving.set(false);
        this.dialogRef.close(user);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }
}
