import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessStore } from '../../../../services/business-store';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { BusinessData } from '../../../../models/admin.models';
import { apiErrorKey } from '../../../../../../core/utils/api-error';
import {
  BusinessField,
  BusinessFieldKey,
  BusinessSectionModal,
  BusinessSectionModalData,
  BusinessSectionModalResult,
} from '../business-section-modal/business-section-modal';

/** una tarjeta de la pantalla: se muestra en solo lectura y se edita con el lápiz */
interface BusinessSection {
  id: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
  // aviso de que se completa con los datos del negocio real (fiscal y canales)
  realBusinessNoteKey?: string;
  fields: BusinessField[];
}

const SECTIONS: BusinessSection[] = [
  {
    id: 'general', icon: 'domain',
    titleKey: 'BUSINESS_DATA.GENERAL.TITLE', subtitleKey: 'BUSINESS_DATA.GENERAL.SUBTITLE',
    fields: [
      { key: 'legalName', labelKey: 'BUSINESS_DATA.GENERAL.LEGAL_NAME', required: true },
      { key: 'taxId', labelKey: 'BUSINESS_DATA.GENERAL.TAX_ID', required: true },
      { key: 'businessType', labelKey: 'BUSINESS_DATA.GENERAL.BUSINESS_TYPE' },
      { key: 'foundationDate', labelKey: 'BUSINESS_DATA.GENERAL.FOUNDATION_DATE', type: 'date' },
      { key: 'legalRep', labelKey: 'BUSINESS_DATA.GENERAL.LEGAL_REP' },
      { key: 'legalRepDoc', labelKey: 'BUSINESS_DATA.GENERAL.LEGAL_REP_DOC' },
    ],
  },
  {
    id: 'contact', icon: 'location_on',
    titleKey: 'BUSINESS_DATA.CONTACT.TITLE', subtitleKey: 'BUSINESS_DATA.CONTACT.SUBTITLE',
    fields: [
      { key: 'address', labelKey: 'BUSINESS_DATA.CONTACT.ADDRESS', required: true },
      { key: 'phone', labelKey: 'BUSINESS_DATA.CONTACT.PHONE', required: true },
      { key: 'email', labelKey: 'BUSINESS_DATA.CONTACT.EMAIL', type: 'email' },
      { key: 'website', labelKey: 'BUSINESS_DATA.CONTACT.WEBSITE' },
    ],
  },
  {
    id: 'fiscal', icon: 'receipt_long',
    titleKey: 'BUSINESS_DATA.FISCAL.TITLE', subtitleKey: 'BUSINESS_DATA.FISCAL.SUBTITLE',
    realBusinessNoteKey: 'BUSINESS_DATA.FISCAL.REAL_BUSINESS_NOTE',
    fields: [
      { key: 'taxRegime', labelKey: 'BUSINESS_DATA.FISCAL.REGIME' },
      { key: 'ciiuActivity', labelKey: 'BUSINESS_DATA.FISCAL.CIIU' },
      { key: 'dianResolution', labelKey: 'BUSINESS_DATA.FISCAL.DIAN_RESOLUTION' },
      { key: 'invoicePrefix', labelKey: 'BUSINESS_DATA.FISCAL.PREFIX' },
      { key: 'invoiceRange', labelKey: 'BUSINESS_DATA.FISCAL.RANGE' },
    ],
  },
  {
    id: 'channels', icon: 'share',
    titleKey: 'BUSINESS_DATA.CHANNELS.TITLE', subtitleKey: 'BUSINESS_DATA.CHANNELS.SUBTITLE',
    realBusinessNoteKey: 'BUSINESS_DATA.CHANNELS.REAL_BUSINESS_NOTE',
    fields: [
      { key: 'instagram', labelKey: 'BUSINESS_DATA.CHANNELS.INSTAGRAM' },
      { key: 'facebook', labelKey: 'BUSINESS_DATA.CHANNELS.FACEBOOK' },
      { key: 'supportLine', labelKey: 'BUSINESS_DATA.CHANNELS.SUPPORT_LINE' },
      { key: 'serviceHours', labelKey: 'BUSINESS_DATA.CHANNELS.SERVICE_HOURS' },
    ],
  },
];

@Component({
  selector: 'app-business-data',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './business-data.html',
  styleUrl: './business-data.scss'
})
export class BusinessDataComponent implements OnInit {

  readonly sections = SECTIONS;

  // lo último guardado en booking-service
  private saved: BusinessData;

  // lo que se ve en pantalla: el lápiz lo cambia y "Guardar cambios" lo confirma
  data: BusinessData;

  loaded = false;
  saving = false;

  constructor(
    private store: BusinessStore,
    private feedback: FeedbackService,
    private dialog: MatDialog,
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

  /** hay cambios hechos con el lápiz que todavía no se guardaron */
  get dirty(): boolean {
    return (Object.keys(this.data) as BusinessFieldKey[]).some(k => (this.data[k] ?? '') !== (this.saved[k] ?? ''));
  }

  /** valor para mostrar; la fecha va como dd/mm/aaaa */
  display(key: BusinessFieldKey): string {
    const value = String(this.data[key] ?? '').trim();
    if (key === 'foundationDate' && value) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    return value;
  }

  editSection(section: BusinessSection): void {
    const data: BusinessSectionModalData = {
      titleKey: section.titleKey,
      subtitleKey: section.subtitleKey,
      icon: section.icon,
      fields: section.fields,
      values: this.data,
    };
    this.dialog.open(BusinessSectionModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: BusinessSectionModalResult | null | undefined) => {
        if (!result) return;
        this.data = { ...this.data, ...result };
        this.changes.markForCheck();
      });
  }

  discard(): void {
    this.data = { ...this.saved };
    this.feedback.info('BUSINESS_DATA.FEEDBACK.DISCARDED_TITLE', 'BUSINESS_DATA.FEEDBACK.DISCARDED_MESSAGE');
  }

  save(): void {
    this.saving = true;
    this.store.save(this.data).subscribe({
      next: business => {
        this.saving = false;
        this.saved = business;
        this.data = { ...business };
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
