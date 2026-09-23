import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { Booking, BookingVehicle } from './bookings';

// Modelo único de pago — reemplaza los 3 shapes distintos (client/payment ad-hoc,
// admin/payments.Payment, payment-review.model.ts) y unifica los métodos de pago:
// antes client usaba CARD/PAYPAL/TRANSFER y admin usaba nequi/bancolombia/daviplata/cash.
export interface Payment {
  id: number;
  bookingId: number;
  bookingCode: string | null;
  service: string | null;
  vehicle: BookingVehicle | null;
  date: string;
  method: string | null;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  receiptUrl: string | null;
  reference: string | null;
}

// El monto no se envía: el mock lo toma del precio calculado de la reserva.
export interface NewPayment {
  bookingId: number;
  paymentAccountId: number;
  transactionReference?: string;
}

export interface PaymentMethod {
  paymentAccountId: number;
  code: string; // NEQUI/BANCOLOMBIA/DAVIPLATA/CASH/CARD
  name: string;
  accountHolder: string;
  accountNumber: string | null;
  instructions: string | null;
  requiresReceipt: boolean;
}

// GET /me/payment-overview: todo lo de la pantalla "Pagar servicio" en una llamada.
export interface PaymentOverview {
  totalPaid: number;
  payableBookings: Booking[];
  methods: PaymentMethod[];
  history: Payment[];
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(private api: Api) {}

  overview$(): Observable<PaymentOverview> {
    return this.api.get<PaymentOverview>('me/payment-overview');
  }

  myPayments$(): Observable<Payment[]> {
    return this.api.get<Payment[]>('me/payments');
  }

  create$(payment: NewPayment): Observable<Payment> {
    return this.api.post<Payment>('me/payments', payment);
  }
}
