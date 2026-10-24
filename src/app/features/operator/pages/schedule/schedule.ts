import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ReservationDetailModal } from '../../../../shared/dialogs/reservation-detail-modal/reservation-detail-modal';
import {
  Reservation,
  reservationStatusClass,
  reservationStatusIcon,
  reservationStatusLabel
} from '../../../../shared/dialogs/reservation-models/reservation.model';
import { MiniCalendarComponent } from './mini-calendar/mini-calendar';
import { canStartNow, startFromLabel, startHintKey } from '../../../../core/utils/operator-work';
import { OperatorScheduleViewModel } from '../../viewmodels/schedule.viewmodel';
import { OperatorWorkViewModel } from '../../viewmodels/operator-work.viewmodel';
import { confirmFinish, confirmStart } from '../../components/work-confirm';

// vista de Mi Agenda: el estado y las acciones están en OperatorScheduleViewModel
@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, MiniCalendarComponent],
  providers: [OperatorScheduleViewModel, OperatorWorkViewModel],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent implements OnInit {

  readonly vm = inject(OperatorScheduleViewModel);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  statusClass = reservationStatusClass;
  canStartNow = canStartNow;
  startHint = startHintKey;
  startFrom = startFromLabel;
  statusIcon = reservationStatusIcon;
  statusLabel = reservationStatusLabel;

  ngOnInit(): void {
    this.vm.load();
  }

  // minutos que faltan para el siguiente servicio (se recalcula al repintar)
  get minutesToNext(): number {
    const next = this.vm.nextService();
    if (!next) return 0;
    return Math.max(0, Math.round((new Date(`${next.date}T${next.time}`).getTime() - Date.now()) / 60000));
  }

  // "21 de octubre" en el idioma elegido
  get readableDate(): string {
    const [, month, day] = this.vm.selectedDate().split('-').map(Number);
    const months: string[] = this.translate.instant('CALENDAR.MONTHS');
    return `${day} ${this.translate.instant('SCHEDULE.OF')} ${months[month - 1]}`;
  }

  // pide confirmación antes de iniciar (igual que al finalizar)
  startService(r: Reservation) {
    if (r.status !== 'pendiente') return;
    confirmStart(this.dialog, r.code).subscribe(confirmed => {
      if (confirmed) this.vm.start(r);
    });
  }

  requestFinish(r: Reservation) {
    confirmFinish(this.dialog, r.code).subscribe(confirmed => {
      if (confirmed) this.vm.finish(r);
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
