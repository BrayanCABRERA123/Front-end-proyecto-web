import { Injectable, computed, inject, signal } from '@angular/core';

// servicios asignados y calificaciones (operations-service); no leídas (notification-service)
import { OperationsApiService } from '../../../core/services/operations-api';
import { NotificationsService } from '../../../core/services/notifications';
import { UserSession } from '../../../core/services/user-session';
import { toWorkReservation } from '../../../core/utils/operator-work';
import { Reservation } from '../../../shared/dialogs/reservation-models/reservation.model';
import { OperatorWorkViewModel } from './operator-work.viewmodel';

export interface OperatorHomeStat {
  icon: string;
  value: number | string;
  label: string;
  notification: number;
  route: string;
}

/** Inicio del operario: sus servicios de hoy, contadores y promedio de calificaciones. */
@Injectable()
export class OperatorHomeViewModel {

  private readonly operations = inject(OperationsApiService);
  private readonly notifications = inject(NotificationsService);
  private readonly session = inject(UserSession);
  private readonly work = inject(OperatorWorkViewModel);

  // primer nombre del usuario que inició sesión
  readonly operatorName = computed(() => this.session.user().name.trim().split(/\s+/)[0] ?? '');

  // sus servicios asignados para hoy
  readonly todayReservations = signal<Reservation[]>([]);
  // no leídas reales; 0 mientras carga o si el servicio no responde
  readonly unreadNotifications = signal(0);
  // promedio real de sus calificaciones; '—' si aún no tiene
  readonly averageRating = signal<number | string>('—');

  readonly totalToday = computed(() => this.todayReservations().length);
  readonly inProgress = computed(() => this.count('en_progreso'));
  readonly pending = computed(() => this.count('pendiente'));
  readonly completedToday = computed(() => this.count('finalizado'));
  readonly progressPercentage = computed(() =>
    this.totalToday() === 0 ? 0 : (this.completedToday() / this.totalToday()) * 100);

  readonly stats = computed<OperatorHomeStat[]>(() => [
    { icon: 'calendar_today', value: this.totalToday(), label: 'OPERATOR_HOME.STATS.ASSIGNED', notification: 0, route: '/operator/schedule' },
    { icon: 'sync', value: this.inProgress(), label: 'OPERATOR_HOME.STATS.IN_PROGRESS', notification: 0, route: '/operator/schedule' },
    { icon: 'notifications', value: this.unreadNotifications(), label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notification: this.unreadNotifications(), route: '/operator/notifications' },
    { icon: 'star_outline', value: this.averageRating(), label: 'OPERATOR_HOME.STATS.RATING', notification: 0, route: '/operator/qualifications' }
  ]);

  load(): void {
    this.loadToday();
    this.notifications.unreadCount().subscribe({
      next: count => this.unreadNotifications.set(count),
      // sin el servicio de notificaciones la tarjeta muestra 0
      error: () => undefined
    });
  }

  start(reservation: Reservation): void {
    this.work.start(reservation.id, reservation.code, () => this.loadToday());
  }

  finish(reservation: Reservation): void {
    this.work.finish(reservation.id, reservation.code, () => this.loadToday());
  }

  // sus servicios de hoy y el promedio de sus calificaciones; sin operations-service quedan vacíos
  private loadToday(): void {
    this.operations.myServices().subscribe({
      next: services => this.todayReservations.set(services.map(toWorkReservation)),
      error: () => undefined
    });
    this.operations.myRatings().subscribe({
      next: ratings => {
        if (ratings.length === 0) return;
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        this.averageRating.set(Math.round(avg * 10) / 10);
      },
      error: () => undefined
    });
  }

  private count(status: Reservation['status']): number {
    return this.todayReservations().filter(r => r.status === status).length;
  }
}
