import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, of } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api';
import { ClientBookingItem, toClientBookingItem } from '../../../core/models/booking-view.models';
import { isActiveStatus } from '../../../core/utils/booking-display';
import { apiErrorKey } from '../../../core/utils/api-error';
import { todayIso } from '../../../core/utils/dates';
// calificaciones que el cliente ya dejó (operations-service)
import { OperationsApiService } from '../../../core/services/operations-api';
// estado de pago de cada reserva (payment-service): decide si se muestra "Pagar"
import { BookingPaymentState, PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

export type HistoryFilter = 'todas' | 'activas' | 'completadas' | 'canceladas';

/** Historial del cliente: sus reservas con calificación y estado de pago, filtros, cancelar y calificar. */
@Injectable()
export class ClientHistoryViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly operations = inject(OperationsApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly feedback = inject(FeedbackService);
  private readonly translate = inject(TranslateService);

  // tope de los filtros de fecha: no hay historial del futuro
  readonly today = todayIso();

  readonly bookings = signal<ClientBookingItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly activeFilter = signal<HistoryFilter>('todas');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly search = signal('');

  // filtro por estado + rango de fechas + texto (código, placa, vehículo, servicio o estado)
  readonly filteredBookings = computed(() => {
    const filter = this.activeFilter();
    const text = this.search().toLowerCase();
    return this.bookings().filter(item => {
      if (filter === 'activas' && !isActiveStatus(item.status)) return false;
      if (filter === 'completadas' && item.status !== 'COMPLETED') return false;
      if (filter === 'canceladas' && item.status !== 'CANCELLED' && item.status !== 'NO_SHOW') return false;
      // booking.date ya viene en aaaa-mm-dd, igual que los inputs de fecha
      if (this.dateFrom() && item.date < this.dateFrom()) return false;
      if (this.dateTo() && item.date > this.dateTo()) return false;
      if (!text) return true;
      return [item.code, item.plate, item.vehicle, ...item.services, this.translate.instant('STATUS.' + item.status)]
        .join(' ').toLowerCase().includes(text);
    });
  });

  // si operations-service o payment-service no responden, las reservas se muestran igual
  // (sin calificaciones o sin estado de pago). Con `silent` (refresco automático, WEB-16) no se
  // muestra el indicador de carga y, si falla, se queda lo que ya había
  load(silent = false): void {
    if (!silent) {
      this.loading.set(true);
      this.loadError.set(null);
    }
    forkJoin({
      bookings: this.bookingApi.myBookings(),
      ratings: this.operations.givenRatings().pipe(catchError(() => of([]))),
      payments: this.paymentsApi.myBookings().pipe(catchError(() => of([] as BookingPaymentState[])))
    }).subscribe({
      next: ({ bookings, ratings, payments }) => {
        const ratingByBooking = new Map(ratings.map(r => [r.bookingId, r]));
        const paymentByBooking = new Map(payments.map(p => [p.bookingId, p]));
        this.bookings.set(bookings
          .map(b => {
            const item = toClientBookingItem(b, paymentByBooking.get(b.id) ?? null);
            const given = ratingByBooking.get(item.id);
            if (given) {
              item.rating = given.rating;
              item.ratingComment = given.comment ?? undefined;
              item.ratingOperator = given.operatorName || undefined;
            }
            return item;
          })
          // de la más nueva a la más antigua (fecha y hora de la reserva)
          .sort((a, b) => `${b.date} ${b.timeRange}`.localeCompare(`${a.date} ${a.timeRange}`)));
        this.loading.set(false);
        this.loadError.set(null);
      },
      error: (error: unknown) => {
        if (silent) return;
        this.loading.set(false);
        this.loadError.set(apiErrorKey(error));
      }
    });
  }

  // cancelación real (POST /bookings/{id}/cancel) y recarga para reflejar el estado
  cancel(item: ClientBookingItem): void {
    this.bookingApi.cancelMyBooking(item.id).subscribe({
      next: () => {
        this.feedback.success('HISTORY.CANCEL_SUCCESS.TITLE', 'HISTORY.CANCEL_SUCCESS.MESSAGE',
          { messageParams: { code: item.code } });
        this.load();
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // el backend valida que esté finalizada y que sea la primera calificación
  rate(item: ClientBookingItem, rating: number, comment: string | null): void {
    this.operations.rate(item.id, rating, comment).subscribe({
      next: saved => {
        this.bookings.update(list => list.map(b => b.id === item.id
          ? { ...b, rating: saved.rating, ratingComment: saved.comment ?? undefined }
          : b));
        this.feedback.success('RATINGS.SUCCESS_TITLE', 'RATINGS.SUCCESS_MESSAGE');
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }
}
