import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Operator, OperatorStatus } from '../../../../models/admin.models';

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

@Component({
  selector: 'app-operator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './operator-modal.html',
  styleUrl: './operator-modal.scss',
})
export class OperatorModal {

  name = '';
  specialty = '';
  phone = '';
  email = '';
  status: OperatorStatus = 'available';
  bay: string | null = null;
  tags: string[] = [];

  editing = false;
  submitted = false;

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
    return this.submitted && this.name.trim().length < 3;
  }

  get specialtyInvalid(): boolean {
    return this.submitted && this.specialty.trim().length < 2;
  }

  get phoneInvalid(): boolean {
    return this.submitted && this.phone.trim().length < 7;
  }

  get emailInvalid(): boolean {
    const value = this.email.trim();
    return this.submitted && value.length > 0 && !EMAIL_RE.test(value);
  }

  get canSave(): boolean {
    const value = this.email.trim();
    return this.name.trim().length >= 3
      && this.specialty.trim().length >= 2
      && this.phone.trim().length >= 7
      && (value.length === 0 || EMAIL_RE.test(value));
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
    if (!this.canSave) return;

    const result: OperatorModalResult = {
      name: this.name.trim(),
      specialty: this.specialty.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      status: this.status,
      // baja médica siempre libera la bahía
      bay: this.status === 'medical_leave' ? null : this.bay,
      tags: this.tags.map(t => t.trim()).filter(t => t.length > 0),
    };

    this.dialogRef.close(result);
  }
}