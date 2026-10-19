import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessData } from '../../../../models/admin.models';
import { todayIso } from '../../../../../../core/utils/dates';

export type BusinessFieldKey = keyof BusinessData;

/** un campo de la sección que se edita en el modal */
export interface BusinessField {
  key: BusinessFieldKey;
  labelKey: string;
  type?: 'text' | 'email' | 'date';
  required?: boolean;
  placeholderKey?: string;
}

export interface BusinessSectionModalData {
  titleKey: string;
  subtitleKey: string;
  icon: string;
  fields: BusinessField[];
  values: BusinessData;
}

/** solo los campos de la sección, con lo que escribió el admin */
export type BusinessSectionModalResult = Partial<BusinessData>;

// las mismas reglas que valida booking-service
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

/** modal del lápiz de Datos del negocio: edita una sección y la devuelve a la pantalla */
@Component({
  selector: 'app-business-section-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './business-section-modal.html',
  styleUrl: './business-section-modal.scss',
})
export class BusinessSectionModal {

  readonly today = todayIso();
  values: Record<string, string> = {};
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<BusinessSectionModal, BusinessSectionModalResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: BusinessSectionModalData,
  ) {
    for (const field of data.fields) {
      this.values[field.key] = String(data.values[field.key] ?? '');
    }
  }

  errorFor(field: BusinessField): string {
    const value = (this.values[field.key] ?? '').trim();
    if (field.required && !value) return 'BUSINESS_DATA.VALIDATION.REQUIRED';
    if (field.key === 'email' && value && !EMAIL_RE.test(value)) return 'BUSINESS_DATA.VALIDATION.EMAIL';
    if (field.key === 'phone' && value && !PHONE_RE.test(value)) return 'BUSINESS_DATA.VALIDATION.PHONE';
    if (field.type === 'date' && value > this.today) return 'BUSINESS_DATA.VALIDATION.FUTURE_DATE';
    return '';
  }

  isInvalid(field: BusinessField): boolean {
    return this.submitted && this.errorFor(field) !== '';
  }

  close(): void {
    this.dialogRef.close(null);
  }

  apply(): void {
    this.submitted = true;
    if (this.data.fields.some(field => this.errorFor(field))) return;

    const result: BusinessSectionModalResult = {};
    for (const field of this.data.fields) {
      (result as Record<string, string>)[field.key] = this.values[field.key].trim();
    }
    this.dialogRef.close(result);
  }
}
