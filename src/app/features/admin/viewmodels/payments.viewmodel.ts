import { Injectable, inject } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { PaymentReviewData } from '../../../shared/dialogs/payment-review-modal/payment-review.model';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { apiErrorKey } from '../../../core/utils/api-error';
import { PaymentsStore } from '../services/payments-store';
import { Payment, PaymentStatus } from '../models/admin.models';
import { ManualPaymentResult } from '../pages/payments/components/payment-modal/payment-modal';
import { paymentMethodLabel, paymentReviewData } from './payment-review';

/** Pagos del admin: filtros, tarjetas, revisar, reembolsar y registrar el pago en el local. */
@Injectable()
export class PaymentsViewModel {

  private readonly store = inject(PaymentsStore);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly feedback = inject(FeedbackService);

  search = '';
  methodFilter = '';
  statusFilter: PaymentStatus | '' = '';

  // pagos reales de payment-service
  load(): void {
    this.store.refresh();
  }

  get payments(): Payment[] { return this.store.payments(); }

  get filteredPayments(): Payment[] {
    const term = this.search.trim().toLowerCase();
    return this.payments
      .filter(p => !this.methodFilter || p.method === this.methodFilter)
      .filter(p => !this.statusFilter || p.status === this.statusFilter)
      .filter(p => !term
        || p.client.toLowerCase().includes(term)
        || p.reference.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term));
  }

  get hasActiveFilters(): boolean {
    return !!this.search || !!this.methodFilter || !!this.statusFilter;
  }

  get stats() {
    const approvedToday = this.payments.filter(p => p.status === 'approved' && p.date === this.store.today);
    return {
      pending: this.payments.filter(p => p.status === 'pending').length,
      approvedToday: approvedToday.length,
      approvedAmount: approvedToday.reduce((sum, p) => sum + p.amount, 0),
      rejected: this.payments.filter(p => p.status === 'rejected').length,
      totalCollected: approvedToday.reduce((sum, p) => sum + p.amount, 0),
      transactionsCount: this.payments.length,
    };
  }

  clearFilters(): void {
    this.search = '';
    this.methodFilter = '';
    this.statusFilter = '';
  }

  methodLabel(method: Payment['method']): string {
    return paymentMethodLabel(method);
  }

  reviewData(payment: Payment): PaymentReviewData {
    return paymentReviewData(payment, this.store);
  }

  // pago recibido en el lavadero para una reserva real
  registerManual(result: ManualPaymentResult): void {
    this.paymentsApi.registerManual(result.bookingId, result.paymentAccountId, result.transactionReference).subscribe({
      next: created => {
        this.store.refresh();
        this.feedback.success('ADMIN_PAYMENTS.FEEDBACK.MANUAL_TITLE', 'ADMIN_PAYMENTS.FEEDBACK.MANUAL_MESSAGE',
          { messageParams: { code: '#PAG-' + created.id, client: created.booking?.code ?? '' } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // el aviso de éxito sale solo cuando payment-service aceptó la decisión
  review(payment: Payment, action: 'approved' | 'rejected', reason?: string): void {
    this.store.review(payment.id, action, reason,
      err => this.feedback.error('COMMON.ERROR', apiErrorKey(err)),
      () => this.feedback.success('ADMIN_PAYMENTS.FEEDBACK.REVIEWED_TITLE', 'ADMIN_PAYMENTS.FEEDBACK.REVIEWED_MESSAGE', {
        messageParams: { code: payment.code },
        details: reason ? [{ label: 'PAYMENT_REVIEW_MODAL.REJECT_REASON_LABEL', value: reason }] : [],
      }));
  }

  // reembolsar revierte los puntos de la reserva
  refund(payment: Payment): void {
    this.store.refund(payment.id,
      () => this.feedback.success('ADMIN_PAYMENTS.REFUND.DONE_TITLE', 'ADMIN_PAYMENTS.REFUND.DONE_MESSAGE',
        { messageParams: { code: payment.code } }),
      err => this.feedback.error('COMMON.ERROR', apiErrorKey(err)));
  }

  // un pago rechazado se explica en un modal de estado con el motivo
  showRejectionReason(payment: Payment): void {
    this.feedback.info('ADMIN_PAYMENTS.FEEDBACK.REJECTED_TITLE', 'ADMIN_PAYMENTS.FEEDBACK.REJECTED_MESSAGE', {
      messageParams: { code: payment.code },
      details: [{ label: 'PAYMENT_REVIEW_MODAL.REJECT_REASON_LABEL', value: payment.rejectionReason ?? '—' }],
    });
  }
}
