import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AvailableOperator, AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';

type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

// operario ya asignado a una reserva (resumen para la tabla)
interface AssignedOperator { initials: string; name: string; }

interface Booking {
  code: string;
  client: string;
  phone: string;
  vehicle: string;
  plate: string;
  service: string;
  date: string;
  timeRange: string;
  relativeTime: string;
  bay: string;
  status: BookingStatus;
  operator: AssignedOperator | null;
}

// pool fijo de operarios que se ofrecen en el modal de asignación
const OPERATOR_POOL: AvailableOperator[] = [
  { id: 'op-cr', initials: 'CR', name: 'Carlos Ruiz', specialty: 'Técnico Detailing Especializado', rating: 4.9, availability: 'available' },
  { id: 'op-am', initials: 'AM', name: 'Andrés Mora', specialty: 'Lavado General & Encerado', rating: 4.7, availability: 'available' },
  { id: 'op-jd', initials: 'JD', name: 'Juan Díaz', specialty: 'Lavador Especialista', rating: 4.8, availability: 'busy', availabilityNote: 'Ocupado 14:00 - 15:30 (Bahía 2)' },
  { id: 'op-mg', initials: 'MG', name: 'Mateo Gómez', specialty: 'Tapicería e Interiores', rating: 4.6, availability: 'unavailable', availabilityNote: 'Incapacidad médica / No disponible' },
];

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss'
})
export class ReservationsComponent {

  // filtros de la barra de arriba
  searchTerm = '';
  selectedDate = new Date().toISOString().slice(0, 10);
  statusFilter = '';
  operatorFilter = '';

  currentPage = 1;
  pageSize = 6;

  bookings: Booking[] = [
    { code: '#RES-8921', client: 'Sofía Castro', phone: '+57 312 456 7890', vehicle: 'Mazda CX-30', plate: 'NQ-4412', service: 'Premium Especial', date: '19/09/2026', timeRange: '15:00 - 16:00', relativeTime: 'En 30 minutos', bay: 'Bahía 3', status: 'confirmed', operator: null },
    { code: '#RES-8920', client: 'Juan Felipe González', phone: '+57 300 123 9988', vehicle: 'Audi A4 Sedán', plate: 'KLL-302', service: 'Premium Automóvil', date: '19/09/2026', timeRange: '15:00 - 16:00', relativeTime: 'Finaliza en 15m', bay: 'Bahía 1', status: 'in_progress', operator: { initials: 'JD', name: 'Juan Díaz' } },
    { code: '#RES-8919', client: 'Diego Herrera', phone: '+57 318 890 1122', vehicle: 'Toyota Hilux', plate: 'THX-780', service: 'Desinfección + Tapicería', date: '19/09/2026', timeRange: '15:00 - 16:00', relativeTime: 'En 1 hora', bay: 'Bahía 2', status: 'confirmed', operator: null },
    { code: '#RES-8918', client: 'Mariana Gómez', phone: '+57 315 223 3445', vehicle: 'Renault Duster', plate: 'FRT-911', service: 'Lavado General + Polichado', date: '19/09/2026', timeRange: '15:00 - 16:00', relativeTime: 'Turno de la tarde', bay: 'Bahía 4', status: 'confirmed', operator: { initials: 'AM', name: 'Andrés Mora' } },
    { code: '#RES-8917', client: 'Esneider Sánchez', phone: '+57 311 987 6543', vehicle: 'Chevrolet Tracker', plate: 'MKO-119', service: 'Básico — Camioneta', date: '19/09/2026', timeRange: '14:00 - 14:45', relativeTime: 'Completado con éxito', bay: 'Bahía 1', status: 'completed', operator: { initials: 'CR', name: 'Carlos Ruiz' } },
    { code: '#RES-8916', client: 'Carolina Vega', phone: '+57 320 776 2200', vehicle: 'Kia Sportage', plate: 'BHY-209', service: 'Combo Completo SUV', date: '19/09/2026', timeRange: '13:30 - 15:00', relativeTime: 'Cancelada por cliente', bay: '—', status: 'cancelled', operator: null },
    { code: '#RES-8915', client: 'Laura Ramírez', phone: '+57 301 445 7788', vehicle: 'Nissan Sentra', plate: 'GHT-556', service: 'Lavado Básico', date: '19/09/2026', timeRange: '12:00 - 12:40', relativeTime: 'Completado con éxito', bay: 'Bahía 2', status: 'completed', operator: { initials: 'JD', name: 'Juan Díaz' } },
    { code: '#RES-8914', client: 'Cristian Peña', phone: '+57 314 998 0021', vehicle: 'Ford Explorer', plate: 'YTR-330', service: 'Detallado Interior', date: '19/09/2026', timeRange: '11:30 - 13:00', relativeTime: 'Completado con éxito', bay: 'Bahía 3', status: 'completed', operator: { initials: 'MG', name: 'Mateo Gómez' } },
    { code: '#RES-8913', client: 'Valentina Ríos', phone: '+57 302 667 4410', vehicle: 'Chevrolet Spark', plate: 'LMK-118', service: 'Encerado', date: '19/09/2026', timeRange: '17:00 - 17:40', relativeTime: 'En 2 horas', bay: 'Bahía 1', status: 'confirmed', operator: null },
    { code: '#RES-8912', client: 'Andrés Torres', phone: '+57 317 220 6690', vehicle: 'Mazda BT-50', plate: 'PQR-902', service: 'Combo Completo Camioneta', date: '19/09/2026', timeRange: '16:30 - 18:00', relativeTime: 'En 1.5 horas', bay: 'Bahía 4', status: 'confirmed', operator: { initials: 'AM', name: 'Andrés Mora' } },
    { code: '#RES-8911', client: 'Natalia Cárdenas', phone: '+57 313 556 8890', vehicle: 'Renault Logan', plate: 'DFT-247', service: 'Lavado Básico', date: '18/09/2026', timeRange: '10:00 - 10:40', relativeTime: 'Completado con éxito', bay: 'Bahía 2', status: 'completed', operator: { initials: 'CR', name: 'Carlos Ruiz' } },
    { code: '#RES-8910', client: 'Camilo Reyes', phone: '+57 316 774 0091', vehicle: 'Jeep Renegade', plate: 'WQX-115', service: 'Premium Automóvil', date: '18/09/2026', timeRange: '09:00 - 10:00', relativeTime: 'Cancelada por lluvia', bay: '—', status: 'cancelled', operator: null },
  ];

  constructor(private dialog: MatDialog) {}

  // nombres para el filtro "Todos los operarios"
  get operatorNames(): string[] {
    return OPERATOR_POOL.map(o => o.name);
  }

  // aplica búsqueda + filtros de estado/operario sobre el listado completo
  get filteredBookings(): Booking[] {
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

  // stats de las 4 tarjetas de arriba, calculadas sobre el listado completo del día
  get stats() {
    return {
      total: this.bookings.length,
      confirmedInProgress: this.bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
      unassigned: this.bookings.filter(b => !b.operator && b.status !== 'cancelled' && b.status !== 'completed').length,
      cancelled: this.bookings.filter(b => b.status === 'cancelled').length,
    };
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

  // abre el modal para elegir el operario de esta reserva
  openAssignModal(booking: Booking): void {
    const modalData: AssignOperatorModalData = {
      bookingCode: booking.code,
      client: booking.client,
      vehicle: booking.vehicle,
      plate: booking.plate,
      service: booking.service,
      timeLabel: `Hoy, ${booking.timeRange}`,
      bay: booking.bay,
      operators: OPERATOR_POOL,
    };

    const dialogRef = this.dialog.open(AssignOperatorModal, {
      panelClass: 'custom-dialog',
      data: modalData
    });

    dialogRef.afterClosed().subscribe((result: AssignOperatorResult | null) => {
      if (!result) return;

      const chosen = OPERATOR_POOL.find(o => o.id === result.operatorId);
      if (!chosen) return;

      booking.operator = { initials: chosen.initials, name: chosen.name };
    });
  }
}
