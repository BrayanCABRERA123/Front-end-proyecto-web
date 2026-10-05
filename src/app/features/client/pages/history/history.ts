import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { BookingApiService } from '../../../../core/services/booking-api';
import { ClientBookingItem, toClientBookingItem } from '../../../../core/models/booking-view.models';
import { isActiveStatus } from '../../../../core/utils/booking-display';
import { apiErrorKey } from '../../../../core/utils/api-error';
// calificaciones que el cliente ya dejó (operations-service)
import { OperationsApiService } from '../../../../core/services/operations-api';
import { catchError, forkJoin, of } from 'rxjs';

type HistoryFilter = 'todas' | 'activas' | 'completadas' | 'canceladas';

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
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent implements OnInit {

  private readonly bookingApi = inject(BookingApiService);
  private readonly changes = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly feedback = inject(FeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly operations = inject(OperationsApiService);

  // reservas reales del cliente (booking-service)
  bookings: ClientBookingItem[] = [];
  loading = false;
  loadError: string | null = null;

  // filtros
  activeFilter: HistoryFilter = 'todas';
  dateFrom = '';
  dateTo = '';
  search = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;
    // si operations-service no responde, las reservas se muestran igual (sin calificaciones)
    forkJoin({
      bookings: this.bookingApi.myBookings(),
      ratings: this.operations.givenRatings().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ bookings, ratings }) => {
        const byBooking = new Map(ratings.map(r => [r.bookingId, r]));
        this.bookings = bookings.map(b => {
          const item = toClientBookingItem(b);
          const given = byBooking.get(item.id);
          if (given) {
            item.rating = given.rating;
            item.ratingComment = given.comment ?? undefined;
          }
          return item;
        });
        this.loading = false;
        this.changes.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.loadError = apiErrorKey(error);
        this.changes.markForCheck();
      }
    });
  }

  // confirmación + cancelación real (POST /bookings/{id}/cancel)
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
      if (!confirmed) return;

      this.bookingApi.cancelMyBooking(item.id).subscribe({
        next: () => {
          this.feedback.success(
            'HISTORY.CANCEL_SUCCESS.TITLE',
            'HISTORY.CANCEL_SUCCESS.MESSAGE',
            { messageParams: { code: item.code } }
          );
          // vuelve a pedir la lista para reflejar el estado cancelado
          this.load();
        },
        error: (error) => {
          this.feedback.error('COMMON.ERROR', apiErrorKey(error));
          this.changes.markForCheck();
        }
      });
    });
  }

  // filtro por estado + rango de fechas + texto (código, placa, vehículo o servicio)
  get filteredBookings(): ClientBookingItem[] {
    return this.bookings.filter(item => {
      if (this.activeFilter === 'activas' && !isActiveStatus(item.status)) return false;
      if (this.activeFilter === 'completadas' && item.status !== 'COMPLETED') return false;
      if (this.activeFilter === 'canceladas' && item.status !== 'CANCELLED' && item.status !== 'NO_SHOW') return false;

      // booking.date ya viene en aaaa-mm-dd, igual que los inputs de fecha
      if (this.dateFrom && item.date < this.dateFrom) return false;
      if (this.dateTo && item.date > this.dateTo) return false;

      if (this.search) {
        const text = this.search.toLowerCase();
        const haystack = [
          item.code,
          item.plate,
          item.vehicle,
          ...item.services,
          this.translate.instant('STATUS.' + item.status)
        ].join(' ').toLowerCase();
        return haystack.includes(text);
      }

      return true;
    });
  }
}
