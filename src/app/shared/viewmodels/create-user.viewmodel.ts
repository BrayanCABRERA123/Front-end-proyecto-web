import { Injectable, computed, inject, signal } from '@angular/core';

// la cuenta se crea de verdad en el security-service
import { UserAdminService } from '../../core/services/user-admin';
import { AuthUser, UserRole } from '../../core/models/auth.models';
import { apiErrorKey } from '../../core/utils/api-error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOCUMENT_RE = /^[0-9]{5,20}$/;
// mismas 4 reglas que el backend: 8+ caracteres, mayúscula, número y carácter especial
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])\S{8,72}$/;

/**
 * El administrador crea una cuenta con uno de los 3 roles fijos (ADR-010) y una contraseña temporal
 * que el usuario puede cambiar desde su perfil.
 */
@Injectable()
export class CreateUserViewModel {

  private readonly userAdmin = inject(UserAdminService);

  // los 3 roles del sistema (security.role)
  readonly roleOptions: { value: UserRole; labelKey: string }[] = [
    { value: 'ADMIN', labelKey: 'PROFILE.ROLE.ADMIN' },
    { value: 'OPERATOR', labelKey: 'PROFILE.ROLE.OPERATOR' },
    { value: 'CLIENT', labelKey: 'PROFILE.ROLE.CLIENT' }
  ];

  readonly documentNumber = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly password = signal('');
  readonly role = signal<UserRole>('OPERATOR');

  // los errores se muestran después del primer intento de crear
  readonly submitted = signal(false);
  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  readonly saving = signal(false);
  readonly errorKey = signal<string | null>(null);

  private readonly documentOk = computed(() => DOCUMENT_RE.test(this.documentNumber().trim()));
  private readonly firstNameOk = computed(() => this.firstName().trim().length >= 2);
  private readonly lastNameOk = computed(() => this.lastName().trim().length >= 2);
  // la validación tiene que ser razonable y entendible por cualquier persona
  private readonly emailOk = computed(() => EMAIL_RE.test(this.email().trim()));
  private readonly passwordOk = computed(() => PASSWORD_RE.test(this.password()));

  readonly documentInvalid = computed(() => this.submitted() && !this.documentOk());
  readonly firstNameInvalid = computed(() => this.submitted() && !this.firstNameOk());
  readonly lastNameInvalid = computed(() => this.submitted() && !this.lastNameOk());
  readonly emailInvalid = computed(() => this.submitted() && !this.emailOk());
  readonly passwordInvalid = computed(() => this.submitted() && !this.passwordOk());

  readonly canCreate = computed(() =>
    this.documentOk() && this.firstNameOk() && this.lastNameOk() && this.emailOk() && this.passwordOk());

  // la cédula solo admite dígitos (quita puntos y espacios si la pegan)
  sanitizeDocument(): void {
    this.documentNumber.update(value => value.replace(/\D/g, '').substring(0, 20));
  }

  /** `created` recibe la cuenta ya creada en el backend (la vista cierra el modal con ella) */
  create(created: (user: AuthUser) => void): void {
    this.submitted.set(true);
    if (!this.canCreate() || this.saving()) return;

    this.saving.set(true);
    this.errorKey.set(null);

    this.userAdmin.createAccount({
      documentNumber: this.documentNumber().trim(),
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      phone: this.phone().trim() || null,
      password: this.password(),
      roles: [this.role()]
    }).subscribe({
      next: user => {
        this.saving.set(false);
        created(user);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
      }
    });
  }
}
