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
import { Reserva } from '../../../../shared/dialogs/reservation-models/reservation.model';
import { Api } from '../../../../core/services/api';

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

  operatorName = 'Camilo';

  unreadNotifications = 0;
  averageRating = 0;

  todayReservations: Reserva[] = [];

  private readonly operatorId = 1;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private api: Api
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.api.getReservationsByOperator(this.operatorId).subscribe(reservations => {
      this.todayReservations = reservations.filter(r => r.fecha === today);
      this.cdr.detectChanges();
    });

    this.api.getNotifications(this.operatorId).subscribe(notifications => {
      this.unreadNotifications = notifications.filter(n => !n.read).length;
      this.cdr.detectChanges();
    });

    this.api.getOperatorQualifications(this.operatorId).subscribe(ratings => {
      if (ratings.length === 0) return;
      const sum = ratings.reduce((total: number, r: any) => total + r.stars, 0);
      this.averageRating = Math.round((sum / ratings.length) * 10) / 10;
      this.cdr.detectChanges();
    });
  }

  get todayTotal(): number {
    return this.todayReservations.length;
  }

  get inProgress(): number {
    return this.todayReservations.filter(r => r.estado === 'en_progreso').length;
  }

  get pending(): number {
    return this.todayReservations.filter(r => r.estado === 'pendiente').length;
  }

  get todayCompleted(): number {
    return this.todayReservations.filter(r => r.estado === 'finalizado').length;
  }

  get progressPercentage(): number {
    if (this.todayTotal === 0) return 0;
    return (this.todayCompleted / this.todayTotal) * 100;
  }

  get stats(): Stat[] {
    return [
      { icon: 'calendar_today', value: this.todayTotal, label: 'OPERATOR_HOME.STATS.ASSIGNED', notification: 0, route: '/operator/schedule' },
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

  startService(r: Reserva) {
    if (r.estado !== 'pendiente') return;
    r.estado = 'en_progreso';
  }

  requestFinish(r: Reserva) {
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
      r.estado = 'finalizado';
      this.cdr.detectChanges();
    });
  }

  viewDetail(r: Reserva) {
    const dialogRef = this.dialog.open(ReservationDetailModal, {
      panelClass: 'custom-dialog',
      data: r
    });

    dialogRef.afterClosed().subscribe(action => {
      if (action === 'iniciar') {
        this.startService(r);
        this.cdr.detectChanges();
      } else if (action === 'finalizar') {
        this.requestFinish(r);
      }
    });
  }
}
