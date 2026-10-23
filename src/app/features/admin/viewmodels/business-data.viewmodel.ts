import { Injectable, computed, inject, signal } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { apiErrorKey } from '../../../core/utils/api-error';
import { BusinessStore } from '../services/business-store';
import { BusinessData } from '../models/admin.models';
import { BusinessFieldKey, BusinessSectionModalResult } from '../pages/settings/components/business-section-modal/business-section-modal';

/**
 * Datos del negocio (booking-service): lo que se edita con el lápiz queda en pantalla y se
 * confirma todo junto con "Guardar cambios".
 */
@Injectable()
export class BusinessDataViewModel {

  private readonly store = inject(BusinessStore);
  private readonly feedback = inject(FeedbackService);

  // lo último guardado en booking-service
  private readonly saved = signal<BusinessData>({ ...this.store.empty });
  // lo que se ve en pantalla
  readonly data = signal<BusinessData>({ ...this.store.empty });
  readonly loaded = signal(false);
  readonly saving = signal(false);

  /** hay cambios hechos con el lápiz que todavía no se guardaron */
  readonly dirty = computed(() => {
    const data = this.data();
    const saved = this.saved();
    return (Object.keys(data) as BusinessFieldKey[]).some(k => (data[k] ?? '') !== (saved[k] ?? ''));
  });

  load(): void {
    this.store.load().subscribe({
      next: business => {
        this.saved.set(business);
        this.data.set({ ...business });
        this.loaded.set(true);
      },
      error: (error: unknown) => this.feedback.error('BUSINESS_DATA.FEEDBACK.LOAD_ERROR_TITLE', apiErrorKey(error))
    });
  }

  /** valor para mostrar; la fecha va como dd/mm/aaaa */
  display(key: BusinessFieldKey): string {
    const value = String(this.data()[key] ?? '').trim();
    if (key === 'foundationDate' && value) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    return value;
  }

  // lo que cambió el modal de una sección (todavía sin guardar)
  applySection(result: BusinessSectionModalResult): void {
    this.data.update(data => ({ ...data, ...result }));
  }

  discard(): void {
    this.data.set({ ...this.saved() });
    this.feedback.info('BUSINESS_DATA.FEEDBACK.DISCARDED_TITLE', 'BUSINESS_DATA.FEEDBACK.DISCARDED_MESSAGE');
  }

  save(): void {
    this.saving.set(true);
    this.store.save(this.data()).subscribe({
      next: business => {
        this.saving.set(false);
        this.saved.set(business);
        this.data.set({ ...business });
        this.feedback.success('BUSINESS_DATA.FEEDBACK.SAVED_TITLE', 'BUSINESS_DATA.FEEDBACK.SAVED_MESSAGE',
          { details: [{ label: 'BUSINESS_DATA.GENERAL.LEGAL_NAME', value: business.legalName }] });
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.feedback.error('BUSINESS_DATA.FEEDBACK.INVALID_TITLE', apiErrorKey(error));
      }
    });
  }
}
