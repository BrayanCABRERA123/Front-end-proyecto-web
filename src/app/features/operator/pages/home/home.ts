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
  icono: string;
  valor: number | string;
  label: string;
  notificacion: number;
  ruta: string;
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

  nombreOperator = 'Camilo';

  notificacionesSinLeer = 0;
  calificacionPromedio = 0;

  reservasHoy: Reserva[] = [];

  private readonly operatorId = 1;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private api: Api
  ) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];

    this.api.getReservationsByOperator(this.operatorId).subscribe(reservas => {
      this.reservasHoy = reservas.filter(r => r.fecha === hoy);
      this.cdr.detectChanges();
    });

    this.api.getNotifications(this.operatorId).subscribe(notificaciones => {
      this.notificacionesSinLeer = notificaciones.filter(n => !n.read).length;
      this.cdr.detectChanges();
    });

    this.api.getOperatorQualifications(this.operatorId).subscribe(calificaciones => {
      if (calificaciones.length === 0) return;
      const suma = calificaciones.reduce((sum: number, c: any) => sum + c.estrellas, 0);
      this.calificacionPromedio = Math.round((suma / calificaciones.length) * 10) / 10;
      this.cdr.detectChanges();
    });
  }

  get totalHoy(): number {
    return this.reservasHoy.length;
  }

  get enProgreso(): number {
    return this.reservasHoy.filter(r => r.estado === 'en_progreso').length;
  }

  get pendientes(): number {
    return this.reservasHoy.filter(r => r.estado === 'pendiente').length;
  }

  get finalizadosHoy(): number {
    return this.reservasHoy.filter(r => r.estado === 'finalizado').length;
  }

  get porcentajeProgreso(): number {
    if (this.totalHoy === 0) return 0;
    return (this.finalizadosHoy / this.totalHoy) * 100;
  }

  get stats(): Stat[] {
    return [
      { icono: 'calendar_today', valor: this.totalHoy, label: 'OPERATOR_HOME.STATS.ASSIGNED', notificacion: 0, ruta: '/operator/schedule' },
      { icono: 'sync', valor: this.enProgreso, label: 'OPERATOR_HOME.STATS.IN_PROGRESS', notificacion: 0, ruta: '/operator/schedule' },
      { icono: 'notifications', valor: this.notificacionesSinLeer, label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notificacion: this.notificacionesSinLeer, ruta: '/operator/notifications' },
      { icono: 'star_outline', valor: this.calificacionPromedio, label: 'OPERATOR_HOME.STATS.RATING', notificacion: 0, ruta: '/operator/qualifications' }
    ];
  }

  irA(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  irAAgenda() {
    this.router.navigateByUrl('/operator/schedule');
  }

  iniciarServicio(r: Reserva) {
    if (r.estado !== 'pendiente') return;
    r.estado = 'en_progreso';
  }

  pedirFinalizar(r: Reserva) {
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

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      r.estado = 'finalizado';
      this.cdr.detectChanges();
    });
  }

  verDetalle(r: Reserva) {
    const dialogRef = this.dialog.open(ReservationDetailModal, {
      panelClass: 'custom-dialog',
      data: r
    });

    dialogRef.afterClosed().subscribe(accion => {
      if (accion === 'iniciar') {
        this.iniciarServicio(r);
        this.cdr.detectChanges();
      } else if (accion === 'finalizar') {
        this.pedirFinalizar(r);
      }
    });
  }
}