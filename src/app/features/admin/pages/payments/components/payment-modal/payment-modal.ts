import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AdminPaymentsService, PayableBooking } from '../../../../../../core/services/admin-payments';
import { PaymentMethod } from '../../../../../../core/services/payments';

// Registro de un pago recibido en sede. Se elige una reserva pendiente de pago (cliente,
// servicio y monto salen de ella) y el método; el mock lo guarda como APROBADO.
// Cierra con true cuando el pago quedó registrado.
@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.scss'
})
export class PaymentModalComponent implements OnInit {

  bookings: PayableBooking[] = [];
  methods: PaymentMethod[] = [];

  bookingId: number | null = null;
  paymentAccountId: number | null = null;
  reference = '';

  saving = false;
  errorMessage: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<PaymentModalComponent>,
    private adminPayments: AdminPaymentsService
  ) {}

  ngOnInit(): void {
    this.adminPayments.manualOptions$().subscribe(options => {
      this.bookings = options.bookings;
      this.methods = options.methods;
      // efectivo por defecto: es el caso más común de pago en sede
      this.paymentAccountId = (options.methods.find(m => m.code === 'CASH') ?? options.methods[0])?.paymentAccountId ?? null;
    });
  }

  get selectedBooking(): PayableBooking | null {
    return this.bookings.find(b => b.bookingId === this.bookingId) ?? null;
  }

  get canRegister(): boolean {
    return !!this.bookingId && !!this.paymentAccountId && !this.saving;
  }

  close(): void {
    this.dialogRef.close(false);
  }

  register(): void {
    if (!this.canRegister) return;

    this.saving = true;
    this.errorMessage = null;

    this.adminPayments
      .registerManual$(this.bookingId!, this.paymentAccountId!, this.reference.trim() || undefined)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.errorMessage = err.error?.message ?? 'Error';
        }
      });
  }
}
