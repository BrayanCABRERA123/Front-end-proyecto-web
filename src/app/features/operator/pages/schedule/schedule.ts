import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import {
  Reservation,
  ReservationStatus,
  reservationStatusClass,
  reservationStatusIcon,
  reservationStatusLabel
} from '../../../../shared/dialogs/reservation-models/reservation.model';
import { MiniCalendarComponent } from './mini-calendar/mini-calendar';

type Tab = 'day' | 'week' | 'completed';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, MiniCalendarComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent {

  activeTab: Tab = 'day';

  selectedDate = this.todayAsText();

  reservations: Reservation[] = [
    { id: 1, code: 'SV-2098', date: '2026-08-31', time: '09:00', service: 'BASIC', client: 'Mario Casas', vehicle: 'CAR', address: 'Chapinero', durationMin: 30, status: 'finalizado' },
    { id: 2, code: 'SV-2099', date: '2026-08-31', time: '15:00', service: 'FULL', client: 'Diana Ríos', vehicle: 'SUV', address: 'Suba', durationMin: 60, status: 'finalizado' },

    { id: 3, code: 'SV-2100', date: '2026-09-01', time: '11:00', service: 'PREMIUM', client: 'Felipe Cruz', vehicle: 'CAR', address: 'Usaquén', durationMin: 50, status: 'finalizado' },

    { id: 4, code: 'SV-2101', date: '2026-09-02', time: '08:00', service: 'PREMIUM', client: 'Carlos Méndez', vehicle: 'CAR', address: 'Chapinero', durationMin: 50, status: 'finalizado' },
    { id: 5, code: 'SV-2102', date: '2026-09-02', time: '10:00', service: 'BASIC', client: 'Ana Ruiz', vehicle: 'MOTO', address: 'Usaquén', durationMin: 25, status: 'en_progreso' },
    { id: 6, code: 'SV-2103', date: '2026-09-02', time: '13:30', service: 'FULL', client: 'Pedro López', vehicle: 'PICKUP', address: 'Suba', durationMin: 70, status: 'pendiente' },
    { id: 7, code: 'SV-2104', date: '2026-09-02', time: '16:00', service: 'PREMIUM', client: 'Sofía Herrera', vehicle: 'CAR', address: 'Teusaquillo', durationMin: 55, status: 'pendiente' },

    { id: 8, code: 'SV-2105', date: '2026-09-03', time: '09:30', service: 'BASIC', client: 'Julián Ortiz', vehicle: 'MOTO', address: 'Engativá', durationMin: 25, status: 'pendiente' },
    { id: 9, code: 'SV-2106', date: '2026-09-03', time: '14:00', service: 'PREMIUM', client: 'Laura Peña', vehicle: 'CAR', address: 'Kennedy', durationMin: 50, status: 'pendiente' },

    { id: 10, code: 'SV-2107', date: '2026-09-04', time: '10:00', service: 'FULL', client: 'Ricardo Nova', vehicle: 'TRUCK', address: 'Fontibón', durationMin: 70, status: 'pendiente' },

    { id: 11, code: 'SV-2108', date: '2026-09-06', time: '08:30', service: 'BASIC', client: 'Camila Torres', vehicle: 'CAR', address: 'Chapinero', durationMin: 30, status: 'pendiente' }
  ];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  get servicesByDate(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const r of this.reservations) {
      map[r.date] = (map[r.date] ?? 0) + 1;
    }
    return map;
  }

  changeTab(tab: Tab) {
    this.activeTab = tab;
  }

  onDateSelected(date: string) {
    this.selectedDate = date;
  }

  get dayReservations(): Reservation[] {
    return this.reservations
      .filter(r => r.date === this.selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  get weekReservations(): Reservation[] {
    const { start, end } = this.weekRange(this.selectedDate);
    return this.reservations
      .filter(r => r.date >= start && r.date <= end)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  get completedReservations(): Reservation[] {
    return this.reservations
      .filter(r => r.status === 'finalizado')
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }

  get visibleList(): Reservation[] {
    if (this.activeTab === 'week') return this.weekReservations;
    if (this.activeTab === 'completed') return this.completedReservations;
    return this.dayReservations;
  }

  get totalForDay(): number {
    return this.dayReservations.length;
  }

  get pendingForDay(): number {
    return this.dayReservations.filter(r => r.status === 'pendiente').length;
  }

  get inProgressForDay(): number {
    return this.dayReservations.filter(r => r.status === 'en_progreso').length;
  }

  get completedForDay(): number {
    return this.dayReservations.filter(r => r.status === 'finalizado').length;
  }

  get viewingToday(): boolean {
    return this.selectedDate === this.todayAsText();
  }

  get nextService(): Reservation | null {
    if (!this.viewingToday) return null;

    const now = new Date();
    const upcoming = this.dayReservations
      .filter(r => r.status !== 'finalizado')
      .filter(r => new Date(`${r.date}T${r.time}`).getTime() >= now.getTime())
      .sort((a, b) => a.time.localeCompare(b.time));

    return upcoming[0] ?? null;
  }

  get minutesToNext(): number {
    if (!this.nextService) return 0;
    const dateTime = new Date(`${this.nextService.date}T${this.nextService.time}`);
    return Math.max(0, Math.round((dateTime.getTime() - Date.now()) / 60000));
  }

  statusClass = reservationStatusClass;
  statusIcon = reservationStatusIcon;
  statusLabel = reservationStatusLabel;

  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;
    r.status = 'en_progreso';
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
