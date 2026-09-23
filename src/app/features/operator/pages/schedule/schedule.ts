import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import {
  Reserva,
  claseEstadoReserva,
  iconoEstadoReserva,
  labelEstadoReserva
} from '../../../../shared/dialogs/reservation-models/reservation.model';
import { MiniCalendarComponent } from './mini-calendar/mini-calendar';
import { Api } from '../../../../core/services/api';

type Tab = 'day' | 'week' | 'done';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, MiniCalendarComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent implements OnInit {

  activeTab: Tab = 'day';

  selectedDate = this.todayAsText();

  reservations: Reserva[] = [];

  private readonly operatorId = 1;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private api: Api
  ) {}

  ngOnInit(): void {
    this.api.getReservationsByOperator(this.operatorId).subscribe(reservations => {
      this.reservations = reservations;
      this.cdr.detectChanges();
    });
  }

  get servicesByDate(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const r of this.reservations) {
      map[r.fecha] = (map[r.fecha] ?? 0) + 1;
    }
    return map;
  }

  changeTab(tab: Tab) {
    this.activeTab = tab;
  }

  onDateSelected(date: string) {
    this.selectedDate = date;
  }

  get dayReservations(): Reserva[] {
    return this.reservations
      .filter(r => r.fecha === this.selectedDate)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  get weekReservations(): Reserva[] {
    const { start, end } = this.weekRange(this.selectedDate);
    return this.reservations
      .filter(r => r.fecha >= start && r.fecha <= end)
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }

  get doneReservations(): Reserva[] {
    return this.reservations
      .filter(r => r.estado === 'finalizado')
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  }

  get visibleList(): Reserva[] {
    if (this.activeTab === 'week') return this.weekReservations;
    if (this.activeTab === 'done') return this.doneReservations;
    return this.dayReservations;
  }

  get dayTotal(): number {
    return this.dayReservations.length;
  }

  get dayPending(): number {
    return this.dayReservations.filter(r => r.estado === 'pendiente').length;
  }

  get dayInProgress(): number {
    return this.dayReservations.filter(r => r.estado === 'en_progreso').length;
  }

  get dayCompleted(): number {
    return this.dayReservations.filter(r => r.estado === 'finalizado').length;
  }

  get viewingToday(): boolean {
    return this.selectedDate === this.todayAsText();
  }

  get nextService(): Reserva | null {
    if (!this.viewingToday) return null;

    const now = new Date();
    const next = this.dayReservations
      .filter(r => r.estado !== 'finalizado')
      .filter(r => new Date(`${r.fecha}T${r.hora}`).getTime() >= now.getTime())
      .sort((a, b) => a.hora.localeCompare(b.hora));

    return next[0] ?? null;
  }

  get minutesToNext(): number {
    if (!this.nextService) return 0;
    const dateTime = new Date(`${this.nextService.fecha}T${this.nextService.hora}`);
    return Math.max(0, Math.round((dateTime.getTime() - Date.now()) / 60000));
  }

  statusClass = claseEstadoReserva;
  statusIcon = iconoEstadoReserva;
  statusLabel = labelEstadoReserva;

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

  get readableDate(): string {
    const [, month, day] = this.selectedDate.split('-').map(Number);
    const months: string[] = this.translate.instant('CALENDAR.MONTHS');
    return `${day} ${this.translate.instant('SCHEDULE.OF')} ${months[month - 1]}`;
  }

  private todayAsText(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private weekRange(dateText: string): { start: string; end: string } {
    const [year, month, day] = dateText.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const mondayOffset = (date.getDay() + 6) % 7; // 0=lunes..6=domingo
    const monday = new Date(date);
    monday.setDate(date.getDate() - mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toText = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { start: toText(monday), end: toText(sunday) };
  }
}
