import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AvailableOperator, AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { ReservationsStore, formatDate, formatTimeRange } from '../../services/reservations-store';
import { OperatorsStore } from '../../services/operators-store';
import { Booking, BookingStatus } from '../../models/admin.models';
import { BookingModal, BookingModalData } from './components/booking-modal/booking-modal';
import { apiErrorKey } from '../../../../core/utils/api-error';
import { BookingDetailModal, BookingDetailResult } from './components/booking-detail-modal/booking-detail-modal';

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
  templateUrl: './reservations.html',
  styleUrls: ['./reservations.scss']
})
export class ReservationsComponent implements OnInit {

  searchTerm = '';
  statusFilter: BookingStatus | '' = '';
  operatorFilter = '';
  selectedDate = '';

  currentPage = 1;
  pageSize = 6;

  constructor(
    private store: ReservationsStore,
    private operators: OperatorsStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  // se recarga al entrar para ver las reservas que llegaron desde la app del cliente
  ngOnInit(): void {
    this.store.load();
  }

  get loading(): boolean { return this.store.loading(); }
  get loadError(): string | null { return this.store.loadError(); }

  reload(): void {
    this.store.load();
  }

  /* ---------- datos ---------- */

  get bookings(): Booking[] { return this.store.bookings(); }

  get today(): string { return this.store.today; }

  // nombres para el filtro "Todos los operarios"
  get operatorNames(): string[] {
    return this.operators.operators().map(o => o.name);
  }

  // etiqueta relativa de la fila: Hoy / Mañana / fecha
  dayLabel(date: string): string {
    if (date === this.today) return 'Hoy';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date === tomorrow.toISOString().slice(0, 10)) return 'Mañana';
    return formatDate(date);
  }

  timeRangeLabel(booking: Booking): string {
    return formatTimeRange(booking.time, booking.durationMin);
  }

  // aplica búsqueda + filtros de estado/operario/fecha sobre el listado completo
  get filteredBookings(): Booking[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.bookings.filter(b => {
      const matchesSearch = !term
        || b.client.toLowerCase().includes(term)
        || b.plate.toLowerCase().includes(term)
        || b.code.toLowerCase().includes(term);

      const matchesStatus = !this.statusFilter || b.status === this.statusFilter;
      const matchesOperator = !this.operatorFilter || b.operator?.name === this.operatorFilter;
      const matchesDate = !this.selectedDate || b.date === this.selectedDate;

      return matchesSearch && matchesStatus && matchesOperator && matchesDate;
    });
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm || !!this.statusFilter || !!this.operatorFilter || !!this.selectedDate;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedBookings(): Booking[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings.slice(start, start + this.pageSize);
  }

  get rangeFrom(): number {
    return this.filteredBookings.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBookings.length);
  }

  // stats de las 4 tarjetas, calculadas sobre las reservas de HOY
  get stats() {
    const todayBookings = this.store.byDate(this.today);
    return {
      total: todayBookings.length,
      confirmedInProgress: todayBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
      unassigned: todayBookings.filter(b => !b.operator && b.status !== 'cancelled' && b.status !== 'completed').length,
      cancelled: todayBookings.filter(b => b.status === 'cancelled').length,
    };
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  selectToday(): void {
    this.selectedDate = this.today;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.operatorFilter = '';
    this.selectedDate = '';
    this.currentPage = 1;
  }

  /* ---------- acciones ---------- */

  // el modal guarda en el backend y se cierra con la reserva ya confirmada
  openCreate(): void {
    const dialogRef = this.dialog.open(BookingModal, { panelClass: 'custom-dialog', data: {} as BookingModalData });

    dialogRef.afterClosed().subscribe((created: Booking | null) => {
      if (!created) return;
      this.feedback.success(
        'ADMIN_RESERVATIONS.FEEDBACK.CREATED_TITLE',
        'ADMIN_RESERVATIONS.FEEDBACK.CREATED_MESSAGE',
        { messageParams: { code: created.code } }
      );
    });
  }

  // reprogramar: fecha, hora y servicios (el vehículo no cambia)
  openEdit(booking: Booking): void {
    const data: BookingModalData = { booking };
    const dialogRef = this.dialog.open(BookingModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((updated: Booking | null) => {
      if (!updated) return;
      this.feedback.success(
        'ADMIN_RESERVATIONS.FEEDBACK.UPDATED_TITLE',
        'ADMIN_RESERVATIONS.FEEDBACK.UPDATED_MESSAGE',
        { messageParams: { code: booking.code } }
      );
    });
  }

  openDetail(booking: Booking): void {
    const dialogRef = this.dialog.open(BookingDetailModal, {
      panelClass: 'custom-dialog',
      data: booking,
    });

    dialogRef.afterClosed().subscribe((result: BookingDetailResult | null) => {
      if (!result) return;

      if (result.action === 'status' && result.status) {
        this.changeStatus(booking, result.status);
      } else if (result.action === 'assign') {
        this.openAssignModal(booking);
      } else if (result.action === 'edit') {
        this.openEdit(booking);
      }
    });
  }

  // el cambio de estado importante (completar / cancelar) pide confirmación
  changeStatus(booking: Booking, status: BookingStatus): void {
    const finishing = status === 'completed' || status === 'cancelled' || status === 'no_show';

    const confirm: ConfirmModalData = {
      title: finishing ? `ADMIN_RESERVATIONS.FEEDBACK.${status.toUpperCase()}_TITLE` : 'ADMIN_RESERVATIONS.FEEDBACK.STATUS_TITLE',
      message: finishing ? `ADMIN_RESERVATIONS.FEEDBACK.${status.toUpperCase()}_CONFIRM` : 'ADMIN_RESERVATIONS.FEEDBACK.STATUS_CONFIRM',
      messageParams: { code: booking.code },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger: status === 'cancelled',
    };

    const confirmRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data: confirm });
    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      // el admin cancela con el motivo OTHER (catálogo booking.cancellation_reason)
      const reason = status === 'cancelled' ? 'OTHER' : undefined;
      this.store.setStatus(booking.id, status, reason).subscribe({
        next: () => {
          // refresca la lista para que la tabla muestre el estado nuevo sin recargar la página
          this.reload();
          this.feedback.success(
            'ADMIN_RESERVATIONS.FEEDBACK.STATUS_TITLE',
            `ADMIN_RESERVATIONS.FEEDBACK.STATUS_${status.toUpperCase()}_MESSAGE`,
            { messageParams: { code: booking.code } }
          );
        },
        error: (error) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
      });
    });
  }

  // operarios disponibles para el modal de asignación, desde el store
  private assignableOperators(): AvailableOperator[] {
    return this.operators.availableOperators().map(o => {
      let availability: AvailableOperator['availability'] = 'available';
      let availabilityNote: string | undefined;

      if (o.status === 'in_service') {
        availability = 'busy';
        availabilityNote = 'ASSIGN_OPERATOR_MODAL.BUSY_NOTE';
      } else if (o.status === 'medical_leave') {
        availability = 'unavailable';
      }

      return {
        id: o.id,
        initials: o.initials,
        name: o.name,
        specialty: o.specialty,
        rating: o.rating,
        availability,
        availabilityNote,
      };
    });
  }

  openAssignModal(booking: Booking): void {
    const modalData: AssignOperatorModalData = {
      bookingCode: booking.code,
      client: booking.client,
      vehicle: booking.vehicle,
      plate: booking.plate,
      service: booking.service,
      timeLabel: `${this.dayLabel(booking.date)}, ${this.timeRangeLabel(booking)}`,
      bay: booking.bay ?? '—',
      operators: this.assignableOperators(),
    };

    const dialogRef = this.dialog.open(AssignOperatorModal, {
      panelClass: 'custom-dialog',
      data: modalData
    });

    dialogRef.afterClosed().subscribe((result: AssignOperatorResult | null) => {
      if (!result) return;
      this.store.assignOperator(booking.id, result.operatorId);
      this.feedback.success(
        'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_TITLE',
        'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_MESSAGE',
        { messageParams: { code: booking.code } }
      );
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

    const rows = this.filteredBookings.map(b => ({
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