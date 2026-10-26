import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent, RatingRequest } from './components/history-card/history-card';
import { BookingDetailModal } from './components/booking-detail-modal/booking-detail-modal';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ClientBookingItem } from '../../../../core/models/booking-view.models';
import { ClientHistoryViewModel } from '../../viewmodels/history.viewmodel';
import { WAITING_POLL_MS, keepFresh } from '../../../../core/services/live-refresh';

// vista del historial del cliente: los datos, filtros y acciones están en ClientHistoryViewModel
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HistoryCardComponent,
    MatIconModule,
    TranslateModule
  ],
  providers: [ClientHistoryViewModel],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent implements OnInit {

  readonly vm = inject(ClientHistoryViewModel);
  private readonly dialog = inject(MatDialog);

  // datos frescos sin recargar (WEB-16): al volver a la pestaña, con cada notificación nueva y cada
  // tanto mientras la pestaña esté visible, porque esta vista espera a otra persona
  constructor() {
    keepFresh(silent => this.vm.load(silent), { pollMs: WAITING_POLL_MS, initial: false });
  }

  ngOnInit(): void {
    this.vm.load();
  }

  // clic en la tarjeta: detalle de la reserva con el botón "Ir al pago"
  openDetail(item: ClientBookingItem): void {
    this.dialog.open(BookingDetailModal, { panelClass: 'custom-dialog', data: item });
  }

  // pide confirmación antes de cancelar (acción irreversible)
  cancelBooking(item: ClientBookingItem): void {
    const data: ConfirmModalData = {
      title: 'HISTORY.CANCEL_CONFIRM.TITLE',
      message: 'HISTORY.CANCEL_CONFIRM.MESSAGE',
      messageParams: { code: item.code },
      confirmText: 'HISTORY.CANCEL_CONFIRM.CONFIRM',
      cancelText: 'HISTORY.CANCEL_CONFIRM.BACK',
      danger: true
    };

    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.vm.cancel(item);
    });
  }

  rateBooking(request: RatingRequest): void {
    this.vm.rate(request.booking, request.rating, request.comment);
  }
}
