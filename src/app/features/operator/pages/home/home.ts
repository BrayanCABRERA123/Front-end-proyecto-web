import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { StatsCardComponent } from './components/stats-card/stats-card';
import { PendingServiceCardComponent } from './components/pending-service-card/pending-service-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
// modal reutilizable para avisar que la acción salió bien
import { StatusModal } from '../../../../shared/dialogs/status-modal/status-modal';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import { Reservation } from '../../../../shared/dialogs/reservation-models/reservation.model';
// número real de notificaciones sin leer (notification-service)
import { NotificationsService } from '../../../../core/services/notifications';
// servicios asignados al operario (operations-service)
import { OperationsApiService } from '../../../../core/services/operations-api';
import { toWorkReservation } from '../../../../core/utils/operator-work';
import { UserSession } from '../../../../core/services/user-session';

interface Stat {
  icon: string;
  value: number | string;
  label: string;
  notification: number;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    PendingServiceCardComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {

  operatorName = '';

  // no leídas reales; 0 mientras carga o si el servicio no responde
  unreadNotifications = 0;
  // promedio real de sus calificaciones (operations-service); '—' si aún no tiene
  averageRating: number | string = '—';

  // sus servicios asignados para hoy
  todayReservations: Reservation[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private notificationsService: NotificationsService,
    private operations: OperationsApiService,
    private session: UserSession
  ) {}

  ngOnInit(): void {
    // primer nombre del usuario que inició sesión
    this.operatorName = this.session.user().name.trim().split(/\s+/)[0] ?? '';
    this.loadToday();

    this.notificationsService.unreadCount().subscribe({
      next: (count) => {
        this.unreadNotifications = count;
        // la app es zoneless: avisamos que redibuje la tarjeta
        this.cdr.markForCheck();
      },
      error: () => {
        // sin el servicio de notificaciones la tarjeta muestra 0
      }
    });
  }

  get totalToday(): number {
    return this.todayReservations.length;
  }

  get inProgress(): number {
    return this.todayReservations.filter(r => r.status === 'en_progreso').length;
  }

  get pending(): number {
    return this.todayReservations.filter(r => r.status === 'pendiente').length;
  }

  get completedToday(): number {
    return this.todayReservations.filter(r => r.status === 'finalizado').length;
  }

  get progressPercentage(): number {
    if (this.totalToday === 0) return 0;
    return (this.completedToday / this.totalToday) * 100;
  }

  get stats(): Stat[] {
    return [
      { icon: 'calendar_today', value: this.totalToday, label: 'OPERATOR_HOME.STATS.ASSIGNED', notification: 0, route: '/operator/schedule' },
      { icon: 'sync', value: this.inProgress, label: 'OPERATOR_HOME.STATS.IN_PROGRESS', notification: 0, route: '/operator/schedule' },
      { icon: 'notifications', value: this.unreadNotifications, label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notification: this.unreadNotifications, route: '/operator/notifications' },
      { icon: 'star_outline', value: this.averageRating, label: 'OPERATOR_HOME.STATS.RATING', notification: 0, route: '/operator/qualifications' }
    ];
  }

  // sus servicios de hoy y el promedio de sus calificaciones
  private loadToday(): void {
    this.operations.myServices().subscribe({
      next: services => {
        this.todayReservations = services.map(toWorkReservation);
        this.cdr.markForCheck();
      },
      error: () => {
        // sin operations-service la lista queda vacía
      }
    });
    this.operations.myRatings().subscribe({
      next: ratings => {
        if (ratings.length === 0) return;
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        this.averageRating = Math.round(avg * 10) / 10;
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
  }

  goTo(route: string) {
    this.router.navigateByUrl(route);
  }

  // el botón dice "Ver servicios asignados", así que lleva a esa pantalla
  goToAssignedServices() {
    this.router.navigateByUrl('/operator/assigned-services');
  }

  // pide confirmación antes de iniciar (igual que al finalizar)
  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;

    const data: ConfirmModalData = {
      title: 'ASSIGNED_SERVICES.DETAIL.START_TITLE',
      message: 'ASSIGNED_SERVICES.DETAIL.START_MESSAGE',
      messageParams: { code: r.code },
      confirmText: 'ASSIGNED_SERVICES.DETAIL.START_CONFIRM',
      cancelText: 'COMMON.CANCEL',
      danger: false
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.operations.start(r.id).subscribe(() => {
        this.loadToday();
        this.showSuccess('ASSIGNED_SERVICES.DETAIL.STARTED_TITLE', 'ASSIGNED_SERVICES.DETAIL.STARTED_MESSAGE', r.code);
      });
    });
  }

  requestFinish(r: Reservation) {
    const data: ConfirmModalData = {
      title: 'SCHEDULE.FINISH_TITLE',
      message: 'SCHEDULE.FINISH_MESSAGE',
      confirmText: 'SCHEDULE.FINISH_CONFIRM',
      cancelText: 'COMMON.CANCEL',
      danger: false
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.operations.finish(r.id).subscribe(() => {
        this.loadToday();
        this.showSuccess('ASSIGNED_SERVICES.DETAIL.FINISHED_TITLE', 'ASSIGNED_SERVICES.DETAIL.FINISHED_MESSAGE', r.code);
      });
    });
  }

  viewDetail(r: Reservation) {
    const dialogRef = this.dialog.open(ReservationDetailModal, {
      panelClass: 'custom-dialog',
      data: r
    });

    dialogRef.afterClosed().subscribe(action => {
      if (action === 'start') {
        this.startService(r);
      } else if (action === 'finish') {
        this.requestFinish(r);
      }
    });
  }

  // avisa que el servicio se inició o finalizó (mismo mensaje que en Servicios asignados)
  private showSuccess(title: string, message: string, code: string) {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data: { title, message, messageParams: { code } }
    });
  }
}
