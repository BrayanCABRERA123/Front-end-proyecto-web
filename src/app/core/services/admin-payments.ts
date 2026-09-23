import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { PaymentReviewAction, PaymentReviewData } from '../../shared/dialogs/payment-review-modal/payment-review.model';
import { PaymentMethod as PaymentAccountOption } from './payments';

// Admin > Pagos. Cada ítem ya trae lo que necesita el modal de revisión (PaymentReviewData).
export interface AdminPayment extends Omit<PaymentReviewData, 'transactionReference' | 'amountDue' | 'receiptDate'> {
  id: number;
  methodName: string;
  reference: string;
  amount: number;
  isoDate: string;
  date: string; // dd/mm/yyyy
  time: string;
  rejectionReason: string | null;
}

export interface AdminPaymentsOverview {
  stats: {
    pending: number;
    approvedToday: number;
    approvedAmount: number;
    rejected: number;
    totalCollected: number;
    transactionsCount: number;
  };
  items: AdminPayment[];
}

export interface PayableBooking {
  bookingId: number;
  code: string;
  client: string;
  service: string;
  date: string;
  amount: number;
}

export interface ManualPaymentOptions {
  bookings: PayableBooking[];
  methods: PaymentAccountOption[];
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  constructor(private api: Api) {}

  list$(): Observable<AdminPaymentsOverview> {
    return this.api.get<AdminPaymentsOverview>('admin/payments');
  }

  review$(id: number, action: PaymentReviewAction, reason?: string): Observable<AdminPayment> {
    return this.api.post<AdminPayment>(`admin/payments/${id}/review`, { action, reason });
  }

  manualOptions$(): Observable<ManualPaymentOptions> {
    return this.api.get<ManualPaymentOptions>('admin/payments/payable-bookings');
  }

  // pago recibido en sede: el monto lo fija el mock con el precio de la reserva
  registerManual$(bookingId: number, paymentAccountId: number, reference?: string): Observable<AdminPayment> {
    return this.api.post<AdminPayment>('admin/payments', { bookingId, paymentAccountId, reference });
  }
}
