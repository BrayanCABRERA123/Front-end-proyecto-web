import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessStore } from '../../../../services/business-store';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { BusinessData } from '../../../../models/admin.models';
import { apiErrorKey } from '../../../../../../core/utils/api-error';
import { todayIso } from '../../../../../../core/utils/dates';

// campos obligatorios del formulario; cada uno tiene su mensaje de error
const REQUIRED_FIELDS: Record<keyof Pick<BusinessData, 'legalName' | 'taxId' | 'address' | 'phone'>, string> = {
  legalName: 'BUSINESS_DATA.VALIDATION.LEGAL_NAME',
  taxId: 'BUSINESS_DATA.VALIDATION.TAX_ID',
  address: 'BUSINESS_DATA.VALIDATION.ADDRESS',
  phone: 'BUSINESS_DATA.VALIDATION.PHONE',
};

// los correos y teléfonos se revisan con una regla sencilla de leer
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

@Component({
  selector: 'app-business-data',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './business-data.html',
  styleUrl: './business-data.scss'
})
export class BusinessDataComponent implements OnInit {

  // tope de los filtros de fecha: no hay historial del futuro
  readonly today = todayIso();

  // lo último guardado en booking-service
  private saved: BusinessData;

  // los campos mutan una copia; solo se confirman al guardar
  data: BusinessData;

  submitted = false;
  loaded = false;
  saving = false;

  constructor(
    private store: BusinessStore,
    private feedback: FeedbackService,
    private changes: ChangeDetectorRef,
  ) {
    this.saved = { ...this.store.empty };
    this.data = { ...this.saved };
  }

  ngOnInit(): void {
    this.store.load().subscribe({
      next: business => {
        this.saved = business;
        this.data = { ...business };
        this.loaded = true;
        this.changes.markForCheck();
      },
      error: err => {
        this.feedback.error('BUSINESS_DATA.FEEDBACK.LOAD_ERROR_TITLE', apiErrorKey(err));
        this.changes.markForCheck();
      }
    });
  }

  isInvalid(key: keyof BusinessData): boolean {
    return this.submitted && this.errorFor(key) !== '';
  }

  errorFor(key: keyof BusinessData): string {
    if (!this.submitted) return '';

    const value = String(this.data[key] ?? '').trim();

    if (key === 'legalName' || key === 'taxId' || key === 'address' || key === 'phone') {
      if (!value) return REQUIRED_FIELDS[key];
    }
    if (key === 'email' && value && !EMAIL_RE.test(value)) return 'BUSINESS_DATA.VALIDATION.EMAIL';
    if (key === 'phone' && value && !PHONE_RE.test(value)) return 'BUSINESS_DATA.VALIDATION.PHONE';

    return '';
  }

  /** el guardado se habilita solo cuando lo obligatorio está completo y bien escrito */
  get canSave(): boolean {
    const requiredOk = (Object.keys(REQUIRED_FIELDS) as (keyof BusinessData)[]).every(
      k => String(this.data[k] ?? '').trim().length > 0
    );
    const emailOk = !this.data.email || EMAIL_RE.test(this.data.email);
    const phoneOk = PHONE_RE.test(this.data.phone);
    return requiredOk && emailOk && phoneOk;
  }

  discard(): void {
    this.data = { ...this.saved };
    this.submitted = false;
    this.feedback.info('BUSINESS_DATA.FEEDBACK.DISCARDED_TITLE', 'BUSINESS_DATA.FEEDBACK.DISCARDED_MESSAGE');
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) {
      this.feedback.error('BUSINESS_DATA.FEEDBACK.INVALID_TITLE', 'BUSINESS_DATA.FEEDBACK.INVALID_MESSAGE');
      return;
    }

    this.saving = true;
    this.store.save(this.data).subscribe({
      next: business => {
        this.saving = false;
        this.saved = business;
        this.data = { ...business };
        this.submitted = false;
        this.feedback.success(
          'BUSINESS_DATA.FEEDBACK.SAVED_TITLE',
          'BUSINESS_DATA.FEEDBACK.SAVED_MESSAGE',
          { details: [{ label: 'BUSINESS_DATA.GENERAL.LEGAL_NAME', value: business.legalName }] }
        );
        this.changes.markForCheck();
      },
      error: err => {
        this.saving = false;
        this.feedback.error('BUSINESS_DATA.FEEDBACK.INVALID_TITLE', apiErrorKey(err));
        this.changes.markForCheck();
      }
    });
  }
}