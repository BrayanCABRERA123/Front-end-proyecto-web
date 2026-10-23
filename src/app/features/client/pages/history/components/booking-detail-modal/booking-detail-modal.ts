import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
import { ClientBookingItem } from '../../../../../../core/models/booking-view.models';

/**
 * Detalle de una reserva del historial del cliente (se abre al hacer clic en la tarjeta).
 * "Ir al pago" lleva a la pantalla de pago de esa reserva, donde está su resumen, el estado
 * del pago y el botón de cancelar.
 */
@Component({
  selector: 'app-booking-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './booking-detail-modal.html',
  styleUrl: './booking-detail-modal.scss'
})
export class BookingDetailModal {

  stars = [1, 2, 3, 4, 5];

  constructor(
    private dialogRef: MatDialogRef<BookingDetailModal>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public booking: ClientBookingItem
  ) {}

  // una reserva cancelada o en la que no se presentó ya no tiene pago que ver
  get canGoToPayment(): boolean {
    return this.booking.status !== 'CANCELLED' && this.booking.status !== 'NO_SHOW';
  }

  get statusClass(): string {
    if (this.booking.status === 'COMPLETED') return 'badge-completed';
    if (this.booking.status === 'CANCELLED' || this.booking.status === 'NO_SHOW') return 'badge-canceled';
    return 'badge-active';
  }

  close() {
    this.dialogRef.close();
  }

  goToPayment() {
    this.dialogRef.close();
    this.router.navigate(['/client/payment'], { queryParams: { booking: this.booking.id } });
  }
}
