import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BookingApiService } from '../../../../../../core/services/booking-api';
import { PaymentAccountResponse, PaymentsApiService } from '../../../../../../core/services/payments-api';
import { servicesLabel } from '../../../../../../core/utils/booking-display';

// lo que devuelve el modal: la reserva, la cuenta y (si es transferencia) su referencia;
// el monto lo pone payment-service
export interface ManualPaymentResult {
  bookingId: number;
  paymentAccountId: number;
  transactionReference: string | null;
}

interface BookingOption {
  id: number;
  code: string;
  label: string;
  services: string;
}

/** Pago recibido en el lavadero (efectivo o transferencia ya verificada) para una reserva real. */
@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.scss'
})
export class PaymentModalComponent implements OnInit {

  private readonly bookingApi = inject(BookingApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  bookings: BookingOption[] = [];
  accounts: PaymentAccountResponse[] = [];
  bookingId: number | null = null;
  accountId: number | null = null;
  // lo que se va a cobrar según payment-service (total menos cupones canjeados); null mientras carga
  amountDue: number | null = null;
  amountFailed = false;
  private amountRequest?: Subscription;
  // opcional: payment-service la usa para no aceptar la misma transferencia en dos reservas
  transactionReference = '';

  constructor(private dialogRef: MatDialogRef<PaymentModalComponent>) {}

  ngOnInit(): void {
    // reservas de los últimos 30 días y la próxima semana que se pueden pagar
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.bookingApi.adminBookings(iso(from), iso(to)).subscribe(list => {
      this.bookings = list
        .filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED')
        .map(b => ({
          id: b.id,
          code: b.code,
          // corto para que quepa en la tarjeta; los servicios se ven debajo al elegir
          label: `${b.code} · ${b.vehicle?.licensePlateFormatted ?? ''} · ${b.date.slice(8, 10)}/${b.date.slice(5, 7)}`,
          services: servicesLabel(b)
        }));
      this.cdr.markForCheck();
    });
    this.paymentsApi.adminAccounts().subscribe(list => {
      this.accounts = list.filter(a => a.active);
      // efectivo primero: es el caso más común en caja
      this.accountId = (this.accounts.find(a => a.methodCode === 'EFECTIVO') ?? this.accounts[0])?.id ?? null;
      this.cdr.markForCheck();
    });
  }

  get selectedServices(): string {
    return this.bookings.find(b => b.id === this.bookingId)?.services ?? '';
  }

  get amountLabel(): string {
    if (this.bookingId === null || this.amountFailed) return '—';
    return this.amountDue === null ? '…' : `$ ${this.amountDue.toLocaleString('es-CO')}`;
  }

  // el monto no es el total de la reserva: payment-service le resta los cupones ya canjeados
  selectBooking(bookingId: number | null): void {
    this.bookingId = bookingId;
    this.amountDue = null;
    this.amountFailed = false;
    this.amountRequest?.unsubscribe();
    if (bookingId === null) return;
    this.amountRequest = this.paymentsApi.amountDue(bookingId).subscribe({
      next: due => {
        this.amountDue = due.amountDue;
        this.cdr.markForCheck();
      },
      // sin respuesta no se adivina la cifra (el total no descuenta cupones); el backend cobra la correcta igual
      error: () => {
        this.amountFailed = true;
        this.cdr.markForCheck();
      }
    });
  }

  get canRegister(): boolean {
    return this.bookingId !== null && this.accountId !== null;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  register(): void {
    if (!this.canRegister) return;
    const result: ManualPaymentResult = {
      bookingId: this.bookingId!,
      paymentAccountId: this.accountId!,
      transactionReference: this.transactionReference.trim() || null
    };
    this.dialogRef.close(result);
  }
}
