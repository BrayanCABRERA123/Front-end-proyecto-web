import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
// modal reutilizable para avisar que la acción salió bien
import { StatusModal } from '../../../../shared/dialogs/status-modal/status-modal';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import {
  Reservation,
  ReservationStatus,
  reservationStatusClass,
  reservationStatusIcon,
  reservationStatusLabel
} from '../../../../shared/dialogs/reservation-models/reservation.model';
import { MiniCalendarComponent } from './mini-calendar/mini-calendar';
// sus servicios asignados (operations-service)
import { OperationsApiService, localIsoDate } from '../../../../core/services/operations-api';
import { toWorkReservation } from '../../../../core/utils/operator-work';

type Tab = 'day' | 'week' | 'completed';

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

  // un mes atrás (terminados) y un mes adelante (agenda)
  reservations: Reservation[] = [];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private operations: OperationsApiService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 30);
    this.operations.myServices(localIsoDate(from), localIsoDate(to)).subscribe({
      next: services => {
        this.reservations = services.map(toWorkReservation);
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
  }

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
        this.load();
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
        this.load();
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
