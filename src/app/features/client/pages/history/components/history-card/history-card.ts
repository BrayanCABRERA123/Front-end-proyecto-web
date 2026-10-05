import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RatingModalComponent, RatingModalData, RatingResult } from '../../../../../../shared/dialogs/rating-modal/rating-modal';
// modal reutilizable para mostrar mensajes de éxito
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';
import { Router } from '@angular/router';
// formato de precio en pesos colombianos
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
import { ClientBookingItem } from '../../../../../../core/models/booking-view.models';
// la calificación se guarda en operations-service
import { OperationsApiService } from '../../../../../../core/services/operations-api';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

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

  // inyeccion de servicios
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private operations: OperationsApiService,
    private feedback: FeedbackService
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

    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '600px',
      data
    });

    dialogRef.afterClosed().subscribe((result?: RatingResult) => {
      if (!result) return;

      this.operations.rate(booking.id, result.rating, result.comment || null).subscribe({
        next: saved => {
          booking.rating = saved.rating;
          booking.ratingComment = saved.comment ?? undefined;

          // la app es zoneless: avisamos a Angular que redibuje la tarjeta
          this.cdr.markForCheck();

          const status: StatusModalData = { title: 'RATINGS.SUCCESS_TITLE', message: 'RATINGS.SUCCESS_MESSAGE' };
          this.dialog.open(StatusModal, {
            panelClass: 'custom-dialog',
            data: status
          });
        },
        error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });

  }
}
