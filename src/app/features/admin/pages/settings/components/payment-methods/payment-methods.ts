import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AddPaymentMethodData, AddPaymentMethodModal, AddPaymentMethodResult } from '../../../../../../shared/dialogs/add-payment-method-modal/add-payment-method-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { PaymentMethodConfig } from '../../../../models/admin.models';
import {
  ALLOWED_IMAGE_TYPES,
  PaymentAccountResponse,
  PaymentsApiService,
  SavePaymentAccountRequest,
  readImageAsDataUrl
} from '../../../../../../core/services/payments-api';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

/**
 * Cuentas del lavadero donde el cliente paga (payment-service). El QR que se sube aquí es el
 * que el cliente ve y escanea con la app de su banco.
 */
@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss'
})
export class PaymentMethodsComponent implements OnInit {

  methods: PaymentMethodConfig[] = [];
  private accounts = new Map<string, PaymentAccountResponse>();

  constructor(
    private api: PaymentsApiService,
    private dialog: MatDialog,
    private feedback: FeedbackService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get activeCount(): number {
    return this.methods.filter(m => m.active).length;
  }

  private load(): void {
    this.api.adminAccounts().subscribe({
      next: accounts => {
        this.accounts = new Map(accounts.map(a => [String(a.id), a]));
        this.methods = accounts.map(toConfig);
        this.cdr.markForCheck();
      },
      error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
    });
  }

  // el cambio de estado pide confirmación para que nadie desactive un medio por error
  toggle(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.TOGGLE_TITLE',
      message: method.active ? 'PAYMENT_METHODS_SECTION.TOGGLE_OFF_MESSAGE' : 'PAYMENT_METHODS_SECTION.TOGGLE_ON_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        this.load(); // devuelve el switch a su estado real
        return;
      }
      this.save(method.id, { active: !method.active }, 'PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_TITLE',
        'PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_MESSAGE', method.name);
    });
  }

  // sube la imagen real del QR (se guarda en payment-service)
  async onQrSelected(method: PaymentMethodConfig, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // payment-service no acepta SVG ni otros formatos: solo PNG o JPG
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      input.value = '';
      this.feedback.error('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.INVALID_FILE_MESSAGE');
      return;
    }
    const qrImageUrl = await readImageAsDataUrl(file);
    this.save(method.id, { qrImageUrl }, 'PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_TITLE',
      'PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_MESSAGE', method.name);
  }

  openAddMethod(): void {
    this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog' }).afterClosed()
      .subscribe((result: AddPaymentMethodResult | null) => {
        if (!result) return;
        this.api.createAccount({
          methodCode: methodCodeFor(result.name, result.type),
          // el titular es obligatorio en payment-service; si no lo escriben, va el nombre del medio
          accountHolder: result.holder || result.name,
          accountNumber: result.accountNumber,
          qrImageUrl: null,
          instructions: null,
          active: true,
        }).subscribe({
          next: () => {
            this.load();
            this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.ADDED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.ADDED_MESSAGE',
              { messageParams: { name: result.name } });
          },
          error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
        });
      });
  }

  openEditMethod(method: PaymentMethodConfig): void {
    const data: AddPaymentMethodData = {
      id: method.id,
      name: method.name,
      type: method.type,
      holder: method.holder,
      accountNumber: method.accountNumber,
      needsQr: method.needsQr,
    };
    this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog', data }).afterClosed()
      .subscribe((result: AddPaymentMethodResult | null) => {
        if (!result || !result.id) return;
        this.save(result.id, {
          methodCode: methodCodeFor(result.name, result.type),
          accountHolder: result.holder || result.name,
          accountNumber: result.accountNumber,
        }, 'PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_MESSAGE', result.name);
      });
  }

  // las cuentas no se borran (hay pagos que las usan): se desactivan
  deleteMethod(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_TITLE',
      message: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true,
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.save(method.id, { active: false }, 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_TITLE',
        'PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_MESSAGE', method.name);
    });
  }

  private save(id: string, changes: Partial<SavePaymentAccountRequest>, title: string, message: string, name: string): void {
    const current = this.accounts.get(id);
    if (!current) return;
    const request: SavePaymentAccountRequest = {
      methodCode: current.methodCode,
      accountHolder: current.accountHolder,
      accountNumber: current.accountNumber,
      qrImageUrl: current.qrImageUrl,
      instructions: current.instructions,
      active: current.active,
      ...changes,
    };
    this.api.updateAccount(Number(id), request).subscribe({
      next: () => {
        this.load();
        this.feedback.success(title, message, { messageParams: { name } });
      },
      error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
    });
  }
}

function toConfig(a: PaymentAccountResponse): PaymentMethodConfig {
  return {
    id: String(a.id),
    name: a.methodName,
    type: a.methodCode.toLowerCase(),
    holder: a.accountHolder,
    accountNumber: a.accountNumber ?? '',
    active: a.active,
    needsQr: a.requiresReceipt,
    qrImage: a.qrImageUrl,
    methodCode: a.methodCode,
  };
}

/** el modal pide un nombre libre; se traduce al medio del catálogo de payment-service */
function methodCodeFor(name: string, type: string): string {
  const text = `${name} ${type}`.toLowerCase();
  if (text.includes('nequi')) return 'NEQUI';
  if (text.includes('davi')) return 'DAVIPLATA';
  if (text.includes('efectivo') || text.includes('cash')) return 'EFECTIVO';
  return 'TRANSFERENCIA';
}
