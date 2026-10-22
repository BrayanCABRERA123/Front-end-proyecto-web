import { Injectable, computed, inject, signal } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { AddPaymentMethodResult } from '../../../shared/dialogs/add-payment-method-modal/add-payment-method-modal';
import { ALLOWED_IMAGE_TYPES, PaymentAccountResponse, PaymentsApiService, SavePaymentAccountRequest, readImageAsDataUrl } from '../../../core/services/payments-api';
import { apiErrorKey } from '../../../core/utils/api-error';
import { PaymentMethodConfig } from '../models/admin.models';

/**
 * Cuentas del lavadero donde el cliente paga (payment-service). El QR que se sube aquí es el que
 * el cliente ve y escanea con la app de su banco. Las cuentas no se borran: se desactivan.
 */
@Injectable()
export class PaymentMethodsViewModel {

  private readonly api = inject(PaymentsApiService);
  private readonly feedback = inject(FeedbackService);

  readonly methods = signal<PaymentMethodConfig[]>([]);
  private accounts = new Map<string, PaymentAccountResponse>();

  readonly activeCount = computed(() => this.methods().filter(m => m.active).length);

  load(): void {
    this.api.adminAccounts().subscribe({
      next: accounts => {
        this.accounts = new Map(accounts.map(a => [String(a.id), a]));
        this.methods.set(accounts.map(toConfig));
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  setActive(method: PaymentMethodConfig, active: boolean): void {
    this.save(method.id, { active }, 'PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_TITLE',
      'PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_MESSAGE', method.name);
  }

  /** sube la imagen real del QR; payment-service solo acepta PNG o JPG (false si el archivo no sirve) */
  async uploadQr(method: PaymentMethodConfig, file: File): Promise<boolean> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.feedback.error('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.INVALID_FILE_MESSAGE');
      return false;
    }
    const qrImageUrl = await readImageAsDataUrl(file);
    this.save(method.id, { qrImageUrl }, 'PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_TITLE',
      'PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_MESSAGE', method.name);
    return true;
  }

  create(result: AddPaymentMethodResult): void {
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
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  update(result: AddPaymentMethodResult): void {
    if (!result.id) return;
    this.save(result.id, {
      methodCode: methodCodeFor(result.name, result.type),
      accountHolder: result.holder || result.name,
      accountNumber: result.accountNumber,
    }, 'PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_MESSAGE', result.name);
  }

  // hay pagos que usan la cuenta: "eliminar" la desactiva
  remove(method: PaymentMethodConfig): void {
    this.save(method.id, { active: false }, 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_TITLE',
      'PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_MESSAGE', method.name);
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
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
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
