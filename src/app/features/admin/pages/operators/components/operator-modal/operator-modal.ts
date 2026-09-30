import { ChangeDetectorRef, Component, Inject, Optional, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Operator, OperatorStatus } from '../../../../models/admin.models';
// la cuenta del operario se crea de verdad en el security-service
import { UserAdminService } from '../../../../../../core/services/user-admin';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

export interface OperatorModalData {
  /** si llega, el modal arranca en modo edición con esos valores */
  operator?: Operator;
  /** bahías activas para poder asignar una o dejar sin asignar */
  bays: { id: string; name: string }[];
}

/** lo que devuelve el modal (compatible con OperatorFormValue del store) */
export interface OperatorModalResult {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  status: OperatorStatus;
  bay: string | null;
  tags: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOCUMENT_RE = /^[0-9]{5,20}$/;
// mismas 4 reglas que el backend: 8+ caracteres, mayúscula, número y carácter especial
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])\S{8,72}$/;

@Component({
  selector: 'app-operator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './operator-modal.html',
  styleUrl: './operator-modal.scss',
})
export class OperatorModal {

  // modo edición: un solo campo de nombre (la cuenta ya existe)
  name = '';

  // modo creación: datos de la cuenta con la que el operario inicia sesión
  documentNumber = '';
  firstName = '';
  lastName = '';
  password = '';
  showPassword = false;

  specialty = '';
  phone = '';
  email = '';
  status: OperatorStatus = 'available';
  bay: string | null = null;
  tags: string[] = [];

  editing = false;
  submitted = false;

  // signals: la app es zoneless y estos cambian dentro de la respuesta HTTP
  saving = signal(false);
  errorKey = signal<string | null>(null);

  private readonly userAdmin = inject(UserAdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private dialogRef: MatDialogRef<OperatorModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: OperatorModalData | null,
  ) {
    const o = data?.operator;
    if (o) {
      this.editing = true;
      this.name = o.name;
      this.specialty = o.specialty;
      this.phone = o.phone;
      this.email = o.email;
      this.status = o.status;
      this.bay = o.bay;
      this.tags = [...o.tags];
    }
  }

  get bays(): { id: string; name: string }[] {
    return this.data?.bays ?? [];
  }

  // una persona de baja médica no puede mantener bahía asignada
  get bayDisabled(): boolean {
    return this.status === 'medical_leave';
  }

  /* ---------- validación visible por campo ---------- */

  get nameInvalid(): boolean {
    return this.submitted && this.editing && this.name.trim().length < 3;
  }

  get documentInvalid(): boolean {
    return this.submitted && !this.editing && !DOCUMENT_RE.test(this.documentNumber.trim());
  }

  get firstNameInvalid(): boolean {
    return this.submitted && !this.editing && this.firstName.trim().length < 2;
  }

  get lastNameInvalid(): boolean {
    return this.submitted && !this.editing && this.lastName.trim().length < 2;
  }

  get passwordInvalid(): boolean {
    return this.submitted && !this.editing && !PASSWORD_RE.test(this.password);
  }

  get specialtyInvalid(): boolean {
    return this.submitted && this.specialty.trim().length < 2;
  }

  get phoneInvalid(): boolean {
    return this.submitted && this.phone.trim().length < 7;
  }

  get emailInvalid(): boolean {
    const value = this.email.trim();
    // al crear, el correo es obligatorio: es con el que el operario inicia sesión
    if (!this.editing) {
      return this.submitted && !EMAIL_RE.test(value);
    }
    return this.submitted && value.length > 0 && !EMAIL_RE.test(value);
  }

  get canSave(): boolean {
    const email = this.email.trim();
    const common = this.specialty.trim().length >= 2 && this.phone.trim().length >= 7;

    if (this.editing) {
      return common && this.name.trim().length >= 3 && (email.length === 0 || EMAIL_RE.test(email));
    }

    return common
      && DOCUMENT_RE.test(this.documentNumber.trim())
      && this.firstName.trim().length >= 2
      && this.lastName.trim().length >= 2
      && EMAIL_RE.test(email)
      && PASSWORD_RE.test(this.password);
  }

  /* ---------- helpers de entrada ---------- */

  // la cédula solo admite dígitos (quita puntos y espacios si la pegan)
  sanitizeDocument(): void {
    this.documentNumber = this.documentNumber.replace(/\D/g, '').substring(0, 20);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /* ---------- etiquetas ---------- */

  addTag(): void {
    this.tags = [...this.tags, ''];
  }

  removeTag(index: number): void {
    this.tags = this.tags.filter((_, i) => i !== index);
  }

  trackByIndex(index: number): number {
    return index;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave || this.saving()) return;

    // editar todavía es solo de la lista en pantalla: los datos del operario (especialidad,
    // bahía, estado) los guardará el operations-service, que aún no existe
    if (this.editing) {
      this.dialogRef.close(this.buildResult(this.name.trim()));
      return;
    }

    this.saving.set(true);
    this.errorKey.set(null);

    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();

    this.userAdmin.createAccount({
      documentNumber: this.documentNumber.trim(),
      firstName,
      lastName,
      email: this.email.trim(),
      phone: this.phone.trim() || null,
      password: this.password,
      roles: ['OPERATOR']
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(this.buildResult(`${firstName} ${lastName}`));
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.errorKey.set(apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }

  private buildResult(name: string): OperatorModalResult {
    return {
      name,
      specialty: this.specialty.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      status: this.status,
      // baja médica siempre libera la bahía
      bay: this.status === 'medical_leave' ? null : this.bay,
      tags: this.tags.map(t => t.trim()).filter(t => t.length > 0),
    };
  }
}
