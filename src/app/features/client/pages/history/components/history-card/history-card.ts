import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RatingModalComponent, RatingModalData, RatingResult } from '../../../../../../shared/dialogs/rating-modal/rating-modal';
import { Router } from '@angular/router';
// formato de precio en pesos colombianos
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
import { ClientBookingItem } from '../../../../../../core/models/booking-view.models';

// lo que el cliente calificó; la página lo guarda en operations-service con su ViewModel
export interface RatingRequest {
  booking: ClientBookingItem;
  rating: number;
  comment: string | null;
}

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, MatDialogModule, CopPricePipe],
  templateUrl: './history-card.html',
  styleUrl: './history-card.scss'
})
export class HistoryCardComponent {

  // reserva del cliente ya mapeada por la página de historial
  @Input() booking!: ClientBookingItem;

  // el padre es quien cancela (tiene el servicio y recarga la lista)
  @Output() cancel = new EventEmitter<ClientBookingItem>();

  // clic en la tarjeta: el padre abre el detalle
  @Output() open = new EventEmitter<ClientBookingItem>();

  // el cliente calificó: el padre la guarda y actualiza la tarjeta
  @Output() rate = new EventEmitter<RatingRequest>();

  constructor(
    private dialog: MatDialog,
    private router: Router
  ) { }

  // estado del servicio para el color del ícono
  get statusClass(): string {
    if (this.booking.status === 'COMPLETED') return 'done';
    if (this.booking.status === 'CANCELLED' || this.booking.status === 'NO_SHOW') return 'cancelled';
    return 'active';
  }

  // ícono según el estado de la reserva
  get statusIcon(): string {
    if (this.booking.status === 'COMPLETED') return 'check_circle';
    if (this.booking.status === 'CANCELLED' || this.booking.status === 'NO_SHOW') return 'cancel';
    return 'schedule';
  }

  // lleva a la pantalla de pago con la reserva concreta
  goToPayment(): void {
    this.router.navigate(['/client/payment'], { queryParams: { booking: this.booking.id } });
  }

  // avisa al padre que se pidió cancelar (él confirma y llama al backend)
  requestCancel(): void {
    this.cancel.emit(this.booking);
  }

  // abre el modal para calificar; el backend valida que esté finalizada y que sea la primera vez
  openRating(booking: ClientBookingItem): void {
    if (booking.rating) return;

    const data: RatingModalData = {
      rating: booking.rating,
      comment: booking.ratingComment
    };

    this.dialog.open(RatingModalComponent, { width: '600px', data })
      .afterClosed()
      .subscribe((result?: RatingResult) => {
        if (result) this.rate.emit({ booking, rating: result.rating, comment: result.comment || null });
      });
  }
}
