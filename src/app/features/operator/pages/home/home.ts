import { Component, ChangeDetectorRef } from '@angular/core';
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
export class HomeComponent {

  operatorName = 'Camilo';

  unreadNotifications = 2;
  averageRating = 4.3;

  todayReservations: Reservation[] = [
    { id: 1, code: 'SV-2101', date: '2026-09-03', time: '14:00', service: 'PREMIUM', client: 'Juan Felipe González', vehicle: 'CAR', address: 'Calle Sur 123, Los Rosales', durationMin: 50, status: 'en_progreso' },
    { id: 2, code: 'SV-2102', date: '2026-09-03', time: '16:30', service: 'BASIC', client: 'Esneider Sánchez', vehicle: 'TRUCK', address: 'Calle Norte 7-06, Miraflores', durationMin: 30, status: 'pendiente' }
  ];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

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

  goTo(route: string) {
    this.router.navigateByUrl(route);
  }

  goToSchedule() {
    this.router.navigateByUrl('/operator/schedule');
  }

  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;
    r.status = 'en_progreso';
  }

  requestFinish(r: Reservation) {
    const data: ConfirmModalData = {
      titulo: 'SCHEDULE.FINISH_TITLE',
      mensaje: 'SCHEDULE.FINISH_MESSAGE',
      textoConfirmar: 'SCHEDULE.FINISH_CONFIRM',
      textoCancelar: 'COMMON.CANCEL',
      peligro: false
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      r.status = 'finalizado';
      this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      } else if (action === 'finish') {
        this.requestFinish(r);
      }
    });
  }
}
