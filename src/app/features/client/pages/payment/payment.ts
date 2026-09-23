// definimos el componente
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Payment, PaymentMethod, PaymentsService } from '../../../../core/services/payments';
import { Booking } from '../../../../core/services/bookings';

// ícono por método de pago (payment_method_type.code del SQL)
const ICON_BY_METHOD: Record<string, string> = {
  NEQUI: 'smartphone',
  DAVIPLATA: 'smartphone',
  BANCOLOMBIA: 'account_balance',
  CASH: 'payments',
  CARD: 'credit_card'
};

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit {

  // métodos de pago habilitados por el negocio (cuentas activas)
  paymentMethods: PaymentMethod[] = [];

  // método seleccionado por el usuario
  selectedMethod: PaymentMethod | null = null;

  // referencia de la transferencia (Nequi/Bancolombia/Daviplata requieren comprobante)
  transactionReference = '';

  // reservas que el cliente todavía puede pagar
  payableBookings: Booking[] = [];
  selectedBooking: Booking | null = null;

  // historial de pagos del cliente y total aprobado (calculado por el mock)
  paymentHistory: Payment[] = [];
  totalPaid = 0;

  paying = false;
  errorKey: string | null = null;
  successKey: string | null = null;

  constructor(
    private paymentsService: PaymentsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  private loadOverview(): void {
    this.paymentsService.overview$().subscribe(overview => {
      this.paymentMethods = overview.methods;
      this.payableBookings = overview.payableBookings;
      this.paymentHistory = overview.history;
      this.totalPaid = overview.totalPaid;

      // conserva la selección si sigue siendo pagable; si no, toma la primera pendiente
      this.selectedBooking =
        this.payableBookings.find(b => b.id === this.selectedBooking?.id) ?? this.payableBookings[0] ?? null;
      this.selectedMethod = this.selectedMethod ?? this.paymentMethods[0] ?? null;
      this.cdr.markForCheck();
    });
  }

  get totalToPay(): number {
    return this.selectedBooking?.price ?? 0;
  }

  get canPay(): boolean {
    if (!this.selectedBooking || !this.selectedMethod || this.paying) return false;
    return !this.selectedMethod.requiresReceipt || !!this.transactionReference.trim();
  }

  iconFor(method: PaymentMethod): string {
    return ICON_BY_METHOD[method.code] ?? 'payments';
  }

  selectMethod(method: PaymentMethod) {
    this.selectedMethod = method;
    this.errorKey = null;
  }

  selectBooking(booking: Booking) {
    this.selectedBooking = booking;
    this.errorKey = null;
  }

  // registra el pago; queda PENDIENTE hasta que el admin lo verifique contra el extracto
  pay() {
    if (!this.canPay) return;

    this.paying = true;
    this.errorKey = null;
    this.successKey = null;

    this.paymentsService
      .create$({
        bookingId: this.selectedBooking!.id,
        paymentAccountId: this.selectedMethod!.paymentAccountId,
        transactionReference: this.transactionReference.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.paying = false;
          this.transactionReference = '';
          this.successKey = 'PAYMENT.SUCCESS';
          this.loadOverview();
        },
        error: (err: HttpErrorResponse) => {
          this.paying = false;
          this.errorKey = err.status === 409 ? 'PAYMENT.ERROR_ALREADY_PAID' : 'PAYMENT.ERROR_GENERIC';
          this.cdr.markForCheck();
        }
      });
  }

}
