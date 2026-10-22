import { Injectable, inject } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { AvailableOperator } from '../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { ReservationsStore } from '../services/reservations-store';
import { OperatorsStore } from '../services/operators-store';
import { Booking, BookingStatus } from '../models/admin.models';
import { apiErrorKey } from '../../../core/utils/api-error';

/**
 * Reservas del admin: búsqueda, filtros y páginas sobre las reservas del store, las tarjetas del
 * día y las acciones (cambiar estado, asignar operario). El store es el estado compartido del rol.
 */
@Injectable()
export class ReservationsViewModel {

  private readonly store = inject(ReservationsStore);
  private readonly operators = inject(OperatorsStore);
  private readonly feedback = inject(FeedbackService);

  searchTerm = '';
  statusFilter: BookingStatus | '' = '';
  operatorFilter = '';
  selectedDate = '';

  currentPage = 1;
  readonly pageSize = 6;

  // se recarga al entrar para ver las reservas que llegaron desde la app del cliente
  load(): void {
    this.store.load();
  }

  get loading(): boolean { return this.store.loading(); }
  get loadError(): string | null { return this.store.loadError(); }
  get bookings(): Booking[] { return this.store.bookings(); }
  get today(): string { return this.store.today; }

  /** la reserva todavía necesita operario (misma regla que el inicio) */
  isUnassigned(booking: Booking): boolean { return this.store.isUnassigned(booking); }

  // nombres para el filtro "Todos los operarios"
  get operatorNames(): string[] {
    return this.operators.operators().map(o => o.name);
  }

  // aplica búsqueda + filtros de estado/operario/fecha sobre el listado completo
  get filteredBookings(): Booking[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.bookings.filter(b =>
      (!term || b.client.toLowerCase().includes(term) || b.plate.toLowerCase().includes(term) || b.code.toLowerCase().includes(term))
      && (!this.statusFilter || b.status === this.statusFilter)
      && (!this.operatorFilter || b.operator?.name === this.operatorFilter)
      && (!this.selectedDate || b.date === this.selectedDate));
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
      unassigned: todayBookings.filter(b => this.store.isUnassigned(b)).length,
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
  bookingCreated(created: Booking): void {
    this.feedback.success('ADMIN_RESERVATIONS.FEEDBACK.CREATED_TITLE', 'ADMIN_RESERVATIONS.FEEDBACK.CREATED_MESSAGE',
      { messageParams: { code: created.code } });
  }

  bookingUpdated(code: string): void {
    this.feedback.success('ADMIN_RESERVATIONS.FEEDBACK.UPDATED_TITLE', 'ADMIN_RESERVATIONS.FEEDBACK.UPDATED_MESSAGE',
      { messageParams: { code } });
  }

  // el admin cancela con el motivo OTHER (catálogo booking.cancellation_reason)
  changeStatus(booking: Booking, status: BookingStatus): void {
    const reason = status === 'cancelled' ? 'OTHER' : undefined;
    this.store.setStatus(booking.id, status, reason).subscribe({
      next: () => {
        // refresca la lista para que la tabla muestre el estado nuevo sin recargar la página
        this.load();
        this.feedback.success('ADMIN_RESERVATIONS.FEEDBACK.STATUS_TITLE',
          `ADMIN_RESERVATIONS.FEEDBACK.STATUS_${status.toUpperCase()}_MESSAGE`, { messageParams: { code: booking.code } });
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // quién está disponible para esa reserva (operations-service); la vista abre el modal con ellos
  loadCandidates(booking: Booking, ready: (operators: AvailableOperator[]) => void): void {
    this.operators.candidatesFor(booking.id).subscribe({
      next: ready,
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // el aviso de éxito sale solo si el backend aceptó la asignación
  assignOperator(booking: Booking, operatorId: string): void {
    this.store.assignOperator(booking.id, operatorId, () =>
      this.feedback.success('ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_TITLE', 'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_MESSAGE',
        { messageParams: { code: booking.code } }));
  }
}
