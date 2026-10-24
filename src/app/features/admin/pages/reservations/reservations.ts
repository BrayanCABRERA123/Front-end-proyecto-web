import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AvailableOperator, AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { formatDate, formatTimeRange } from '../../services/reservations-store';
import { Booking, BookingStatus } from '../../models/admin.models';
import { BookingModal, BookingModalData } from './components/booking-modal/booking-modal';
import { isoDaysFromToday } from '../../../../core/utils/dates';
import { BookingDetailModal, BookingDetailResult } from './components/booking-detail-modal/booking-detail-modal';
import { ReservationsViewModel } from '../../viewmodels/reservations.viewmodel';
import { assignActionOf } from '../../models/booking-assignment';
import { WAITING_POLL_MS, keepFresh } from '../../../../core/services/live-refresh';

// vista de Reservas del admin: filtros, páginas y acciones están en ReservationsViewModel; aquí
// quedan las etiquetas de fecha, los modales, las confirmaciones y la exportación
@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TranslateModule,
    SidebarComponent,
    EmptyStateComponent,
  ],
  providers: [ReservationsViewModel],
  templateUrl: './reservations.html',
  styleUrls: ['./reservations.scss']
})
export class ReservationsComponent implements OnInit {

  readonly vm = inject(ReservationsViewModel);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña, con cada notificación
  // nueva y cada tanto mientras la pestaña esté visible, porque esta vista espera a otras personas
  constructor() {
    keepFresh(silent => this.vm.load(silent), { pollMs: WAITING_POLL_MS });
  }

  ngOnInit(): void {
    this.vm.loadCancellationReasons();
  }

  // etiqueta relativa de la fila: Hoy / Mañana / fecha
  dayLabel(date: string): string {
    if (date === this.vm.today) return this.translate.instant('ADMIN_RESERVATIONS.TABLE.TODAY');
    if (date === isoDaysFromToday(1)) return this.translate.instant('ADMIN_RESERVATIONS.TABLE.TOMORROW');
    return formatDate(date);
  }

  timeRangeLabel(booking: Booking): string {
    return formatTimeRange(booking.time, booking.durationMin);
  }

  /* ---------- acciones ---------- */

  // el modal guarda en el backend y se cierra con la reserva ya confirmada
  openCreate(): void {
    this.dialog.open(BookingModal, { panelClass: 'custom-dialog', data: {} as BookingModalData })
      .afterClosed()
      .subscribe((created: Booking | null) => {
        if (created) this.vm.bookingCreated(created);
      });
  }

  // reprogramar: fecha, hora y servicios (el vehículo no cambia)
  openEdit(booking: Booking): void {
    const data: BookingModalData = { booking };
    this.dialog.open(BookingModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((updated: Booking | null) => {
        if (updated) this.vm.bookingUpdated(booking.code);
      });
  }

  openDetail(booking: Booking): void {
    this.dialog.open(BookingDetailModal, { panelClass: 'custom-dialog', data: booking })
      .afterClosed()
      .subscribe((result: BookingDetailResult | null) => {
        if (!result) return;
        if (result.action === 'status' && result.status) {
          this.changeStatus(booking, result.status);
        } else if (result.action === 'assign') {
          this.openAssignModal(booking);
        } else if (result.action === 'edit') {
          this.openEdit(booking);
        } else if (result.action === 'inspection') {
          this.router.navigate(['/admin/reservations', booking.id, 'inspection']);
        }
      });
  }

  // el cambio de estado importante (completar / cancelar / no asistió) pide confirmación
  changeStatus(booking: Booking, status: BookingStatus): void {
    const finishing = status === 'completed' || status === 'cancelled' || status === 'no_show';
    const confirm: ConfirmModalData = {
      title: finishing ? `ADMIN_RESERVATIONS.FEEDBACK.${status.toUpperCase()}_TITLE` : 'ADMIN_RESERVATIONS.FEEDBACK.STATUS_TITLE',
      message: finishing ? `ADMIN_RESERVATIONS.FEEDBACK.${status.toUpperCase()}_CONFIRM` : 'ADMIN_RESERVATIONS.FEEDBACK.STATUS_CONFIRM',
      messageParams: { code: booking.code },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: status === 'cancelled',
      // A-20: al cancelar, el administrador elige el motivo
      options: status === 'cancelled'
        ? this.vm.cancellationReasons().map(reason => ({ value: reason.code, label: reason.name }))
        : undefined,
      optionsLabel: 'ADMIN_RESERVATIONS.CANCEL_REASON',
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data: confirm })
      .afterClosed()
      .subscribe((result: boolean | string) => {
        if (result) this.vm.changeStatus(booking, status, typeof result === 'string' ? result : undefined);
      });
  }

  // primero pide a operations quién está disponible para esa reserva y luego abre el modal
  // A-02: asignar o reasignar operario (lo decide assignActionOf)
  readonly assignActionOf = assignActionOf;

  openAssignModal(booking: Booking): void {
    this.vm.loadCandidates(booking, operators => this.showAssignModal(booking, operators));
  }

  private showAssignModal(booking: Booking, operators: AvailableOperator[]): void {
    const modalData: AssignOperatorModalData = {
      bookingCode: booking.code,
      client: booking.client,
      vehicle: booking.vehicle,
      plate: booking.plate,
      service: booking.service,
      timeLabel: `${this.dayLabel(booking.date)}, ${this.timeRangeLabel(booking)}`,
      bay: booking.bay ?? '—',
      operators,
    };
    this.dialog.open(AssignOperatorModal, { panelClass: 'custom-dialog', data: modalData })
      .afterClosed()
      .subscribe((result: AssignOperatorResult | null) => {
        if (result) this.vm.assignOperator(booking, result.operatorId, result.notes);
      });
  }

  // exporta la lista que el admin está viendo (con los filtros aplicados)
  exportData(): void {
    const columns: ExportColumn[] = [
      { key: 'code', labelKey: 'BOOKING_DETAIL.CODE' },
      { key: 'client', labelKey: 'ADMIN_RESERVATIONS.TABLE.CLIENT' },
      { key: 'vehicle', labelKey: 'BOOKING_DETAIL.VEHICLE' },
      { key: 'plate', labelKey: 'BOOKING_DETAIL.PLATE' },
      { key: 'service', labelKey: 'BOOKING_DETAIL.SERVICE' },
      { key: 'date', labelKey: 'BOOKING_DETAIL.DATE' },
      { key: 'time', labelKey: 'BOOKING_DETAIL.TIME' },
      { key: 'bay', labelKey: 'BOOKING_DETAIL.BAY' },
      { key: 'status', labelKey: 'ADMIN_RESERVATIONS.TABLE.STATUS' },
    ];

    const rows = this.vm.filteredBookings.map(b => ({
      code: b.code,
      client: b.client,
      vehicle: b.vehicle,
      plate: b.plate,
      service: b.service,
      date: formatDate(b.date),
      time: this.timeRangeLabel(b),
      bay: b.bay ?? '—',
      status: b.status,
    }));

    const data: ExportDataModalData = {
      titleKey: 'ADMIN_PAGES.RESERVATIONS.TITLE',
      subtitleKey: 'ADMIN_RESERVATIONS.EXPORT',
      fileName: 'reservas',
      documentTitle: 'Reservas',
      columns,
      rows,
    };

    this.dialog.open(ExportDataModal, { panelClass: 'custom-dialog', data });
  }
}
