import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { AdminBooking, AdminBookingsService } from '../../../../core/services/admin-bookings';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss'
})
export class ReservationsComponent implements OnInit {

  // filtros de la barra de arriba
  searchTerm = '';
  // fecha local (toISOString daría el día UTC y en la noche saltaría al siguiente)
  selectedDate = ReservationsComponent.todayText();
  statusFilter = '';
  operatorFilter = '';

  currentPage = 1;
  pageSize = 6;

  // reservas del día elegido (GET /admin/bookings?date=)
  bookings: AdminBooking[] = [];
  operatorNames: string[] = [];
  stats = { total: 0, confirmedInProgress: 0, unassigned: 0, cancelled: 0 };

  // mensaje del mock API (operario no disponible, reserva ya iniciada, etc.)
  errorMessage: string | null = null;

  constructor(
    private dialog: MatDialog,
    private adminBookings: AdminBookingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private static todayText(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  load(): void {
    this.adminBookings.list$(this.selectedDate).subscribe(day => {
      this.bookings = day.items;
      this.operatorNames = day.operatorNames;
      this.stats = day.stats;
      this.currentPage = 1;
      this.cdr.markForCheck();
    });
  }

  goToToday(): void {
    this.selectedDate = ReservationsComponent.todayText();
    this.load();
  }

  // aplica búsqueda + filtros de estado/operario sobre el listado completo
  get filteredBookings(): AdminBooking[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.bookings.filter(b => {
      const matchesSearch = !term
        || b.client.toLowerCase().includes(term)
        || b.plate.toLowerCase().includes(term);

      const matchesStatus = !this.statusFilter || b.status === this.statusFilter;
      const matchesOperator = !this.operatorFilter || b.operator?.name === this.operatorFilter;

      return matchesSearch && matchesStatus && matchesOperator;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBookings.length / this.pageSize));
  }

  // ej: totalPages = 3 -> [1, 2, 3], para pintar los botones de paginación
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedBookings(): AdminBooking[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBookings.slice(start, start + this.pageSize);
  }

  get rangeFrom(): number {
    return this.filteredBookings.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBookings.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.operatorFilter = '';
    this.currentPage = 1;
  }

  // abre el modal con los operarios que el mock calculó como disponibles para esta reserva
  openAssignModal(booking: AdminBooking): void {
    this.errorMessage = null;

    this.adminBookings.operatorOptions$(booking.id).subscribe(operators => {
      const modalData: AssignOperatorModalData = {
        bookingCode: booking.code,
        client: booking.client,
        vehicle: booking.vehicle,
        plate: booking.plate,
        service: booking.service,
        timeLabel: `${booking.date}, ${booking.timeRange}`,
        bay: booking.bay,
        operators
      };

      const dialogRef = this.dialog.open(AssignOperatorModal, {
        panelClass: 'custom-dialog',
        data: modalData
      });

      dialogRef.afterClosed().subscribe((result: AssignOperatorResult | null) => {
        if (!result) return;

        this.adminBookings.assign$(booking.id, result.operatorId, result.notes).subscribe({
          next: () => this.load(),
          error: (err: HttpErrorResponse) => {
            this.errorMessage = err.error?.message ?? 'Error';
            this.cdr.markForCheck();
          }
        });
      });
    });
  }
}
