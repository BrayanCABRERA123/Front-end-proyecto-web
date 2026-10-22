import { PaymentReviewData } from '../../../shared/dialogs/payment-review-modal/payment-review.model';
import { PaymentsStore, formatPaymentDate } from '../services/payments-store';
import { Payment } from '../models/admin.models';
import { AuthUser } from '../../../core/models/auth.models';

// lo que comparten el dashboard y la pantalla de pagos del admin al revisar un pago

/** nombre comercial de cada medio de pago */
export function paymentMethodLabel(method: Payment['method']): string {
  const labels: Record<Payment['method'], string> = {
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    transfer: 'Transferencia',
    cash: 'Efectivo',
  };
  return labels[method] ?? method;
}

/** lo que muestra el modal de revisión de un pago */
export function paymentReviewData(payment: Payment, store: PaymentsStore, reviewer: AuthUser | null): PaymentReviewData {
  return {
    code: payment.code,
    status: payment.status,
    client: payment.client,
    phone: payment.phone,
    email: payment.email,
    bookingCode: payment.bookingCode,
    service: payment.service,
    vehicle: payment.vehicle,
    plate: payment.plate,
    scheduleLabel: payment.scheduleLabel,
    bay: payment.bay,
    operator: payment.operator,
    method: payment.method,
    transactionReference: payment.reference,
    amountDue: payment.amount,
    amountDeclared: payment.amountDeclared,
    receiptDate: `${formatPaymentDate(payment.date)}, ${payment.time} COT`,
    bankAccount: payment.bankAccount,
    rejectionReason: payment.rejectionReason,
    receiptImage: store.receiptOf(payment.id),
    payee: store.payeeOf(payment.id),
    reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}`.trim() : '',
  };
}
