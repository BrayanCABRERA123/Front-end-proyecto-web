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
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import { Reservation } from '../../../../shared/dialogs/reservation-models/reservation.model';
import { OperatorWorkService } from '../../../../core/services/operator-work';

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

  // jornada de hoy del operario autenticado (GET /me/operator/dashboard, ya calculada)
  operatorName = '';
  unreadNotifications = 0;
  averageRating = 0;
  todayReservations: Reservation[] = [];

  totalToday = 0;
  inProgress = 0;
  pending = 0;
  completedToday = 0;
  progressPercentage = 0;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private operatorWork: OperatorWorkService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.operatorWork.dashboard$().subscribe(d => {
      this.operatorName = d.name;
      this.unreadNotifications = d.unreadNotifications;
      this.averageRating = d.averageRating;
      this.todayReservations = d.todayServices;
      this.totalToday = d.today.total;
      this.inProgress = d.today.inProgress;
      this.pending = d.today.pending;
      this.completedToday = d.today.completed;
      this.progressPercentage = d.today.progressPercentage;
      this.cdr.markForCheck();
    });
  }

  get stats(): Stat[] {
    return [
      { icon: 'calendar_today', value: this.totalToday, label: 'OPERATOR_HOME.STATS.ASSIGNED', notification: 0, route: '/operator/schedule' },
      { icon: 'sync', value: this.inProgress, label: 'OPERATOR_HOME.STATS.IN_PROGRESS', notification: 0, route: '/operator/schedule' },
      { icon: 'notifications', value: this.unreadNotifications, label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notification: this.unreadNotifications, route: '/operator/notifications' },
      { icon: 'star_outline', value: this.averageRating, label: 'OPERATOR_HOME.STATS.RATING', notification: 0, route: '/operator/qualifications' }
    ];
  }

  goTo(route: string) {
    this.router.navigateByUrl(route);
  }

  goToSchedule() {
    this.router.navigateByUrl('/operator/schedule');
  }

  // el mock cambia service_execution y la reserva; se recarga para refrescar contadores
  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;
    this.operatorWork.start$(r.id).subscribe(() => this.load());
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
      this.operatorWork.finish$(r.id).subscribe(() => this.load());
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
}
