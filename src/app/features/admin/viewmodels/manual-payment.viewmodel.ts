import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api';
import { PaymentAccountResponse, PaymentsApiService } from '../../../core/services/payments-api';
import { localIsoDate } from '../../../core/services/operations-api';
import { servicesLabel } from '../../../core/utils/booking-display';

// lo que devuelve el modal: la reserva, la cuenta y (si es transferencia) su referencia;
// el monto lo pone payment-service
export interface ManualPaymentResult {
  bookingId: number;
  paymentAccountId: number;
  transactionReference: string | null;
}

export interface BookingOption {
  id: number;
  code: string;
  label: string;
  services: string;
}

/** Pago recibido en el lavadero (efectivo o transferencia ya verificada) para una reserva real. */
@Injectable()
export class ManualPaymentViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly paymentsApi = inject(PaymentsApiService);

  readonly bookings = signal<BookingOption[]>([]);
  readonly accounts = signal<PaymentAccountResponse[]>([]);
  readonly bookingId = signal<number | null>(null);
  readonly accountId = signal<number | null>(null);
  // lo que se va a cobrar según payment-service (total menos cupones canjeados); null mientras carga
  readonly amountDue = signal<number | null>(null);
  readonly amountFailed = signal(false);
  // opcional: payment-service la usa para no aceptar la misma transferencia en dos reservas
  readonly transactionReference = signal('');
  private amountRequest?: Subscription;

  readonly selectedServices = computed(() => this.bookings().find(b => b.id === this.bookingId())?.services ?? '');

  readonly amountLabel = computed(() => {
    if (this.bookingId() === null || this.amountFailed()) return '—';
    const due = this.amountDue();
    return due === null ? '…' : `$ ${due.toLocaleString('es-CO')}`;
  });

  readonly canRegister = computed(() => this.bookingId() !== null && this.accountId() !== null);

  // reservas de los últimos 30 días y la próxima semana que se pueden pagar, y las cuentas activas
  load(): void {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    this.bookingApi.adminBookings(localIsoDate(from), localIsoDate(to)).subscribe(list => {
      this.bookings.set(list
        .filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED')
        .map(b => ({
          id: b.id,
          code: b.code,
          // corto para que quepa en la tarjeta; los servicios se ven debajo al elegir
          label: `${b.code} · ${b.vehicle?.licensePlateFormatted ?? ''} · ${b.date.slice(8, 10)}/${b.date.slice(5, 7)}`,
          services: servicesLabel(b)
        })));
    });
    this.paymentsApi.adminAccounts().subscribe(list => {
      const active = list.filter(a => a.active);
      this.accounts.set(active);
      // efectivo primero: es el caso más común en caja
      this.accountId.set((active.find(a => a.methodCode === 'EFECTIVO') ?? active[0])?.id ?? null);
    });
  }

  // el monto no es el total de la reserva: payment-service le resta los cupones ya canjeados
  selectBooking(bookingId: number | null): void {
    this.bookingId.set(bookingId);
    this.amountDue.set(null);
    this.amountFailed.set(false);
    this.amountRequest?.unsubscribe();
    if (bookingId === null) return;
    this.amountRequest = this.paymentsApi.amountDue(bookingId).subscribe({
      next: due => this.amountDue.set(due.amountDue),
      // sin respuesta no se adivina la cifra (el total no descuenta cupones); el backend cobra la correcta igual
      error: () => this.amountFailed.set(true)
    });
  }

  /** lo que devuelve el modal al registrar; null si falta la reserva o la cuenta */
  result(): ManualPaymentResult | null {
    const bookingId = this.bookingId();
    const accountId = this.accountId();
    if (bookingId === null || accountId === null) return null;
    return { bookingId, paymentAccountId: accountId, transactionReference: this.transactionReference().trim() || null };
  }
}
