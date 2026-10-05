import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationsApiService, OperatorServiceResponse } from '../../../../core/services/operations-api';
import { isoToDisplayDate } from '../../../../core/utils/booking-display';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { apiErrorKey } from '../../../../core/utils/api-error';

// fila que pintan la tabla y el detalle
export interface OperatorServiceRow {
  bookingId: number;
  id: string;
  serviceType: string;
  dateTime: string;
  vehicle: string;
  client: string;
  phone: string;
  status: string;
  statusColor: 'pending' | 'progress' | 'completed';
  paymentMethod: string;
}

/**
 * Servicios asignados al operario (operations-service). Iniciar y finalizar los valida el backend
 * (que sean suyos, que no tenga otro en curso) y mueve también la reserva en booking-service.
 */
@Component({
  selector: 'app-assigned-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ServiceTableComponent,
    ServiceDetailComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './assigned-services.html',
  styleUrl: './assigned-services.scss'
})
export class AssignedServicesComponent implements OnInit {

  private readonly operations = inject(OperationsApiService);
  private readonly translate = inject(TranslateService);
  private readonly feedback = inject(FeedbackService);

  private readonly rows = signal<OperatorServiceRow[]>([]);

  // estadísticas calculadas de las reservas cargadas
  readonly statsList = computed(() => {
    const rows = this.rows();
    return [
      { value: rows.length, label: 'ASSIGNED_SERVICES.STATS.TOTAL', color: 'total' },
      { value: rows.filter(r => r.statusColor === 'pending').length, label: 'ASSIGNED_SERVICES.STATS.PENDING', color: 'pending' },
      { value: rows.filter(r => r.statusColor === 'progress').length, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS', color: 'progress' },
      { value: rows.filter(r => r.statusColor === 'completed').length, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'completed' }
    ];
  });

  get stats() {
    return this.statsList();
  }

  // filtros de búsqueda
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  vehicleFilter: string = '';

  serviceTypes = [{ value: '', label: 'ASSIGNED_SERVICES.FILTERS.ALL' }];

  selectedService: OperatorServiceRow | null = null;

  ngOnInit(): void {
    this.load();
  }

  // carga las reservas del día elegido (hoy si no hay fecha)
  load(): void {
    const day = this.dateFilter || undefined;
    this.operations.myServices(day, day).subscribe({
      next: bookings => {
        const rows = bookings.map(b => this.toRow(b));
        this.rows.set(rows);
        this.selectedService = rows.find(r => r.bookingId === this.selectedService?.bookingId) ?? rows[0] ?? null;
      },
      error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
    });
  }

  resetFilters(): void {
    this.dateFilter = '';
    this.vehicleFilter = '';
    this.load();
  }

  onServiceSelected(service: OperatorServiceRow): void {
    this.selectedService = service;
  }

  // el detalle pide empezar o terminar; el backend valida la transición
  onAdvance(status: 'IN_PROGRESS' | 'COMPLETED'): void {
    if (!this.selectedService) return;
    const id = this.selectedService.bookingId;
    const call = status === 'IN_PROGRESS' ? this.operations.start(id) : this.operations.finish(id);
    call.subscribe({
      next: () => this.load(),
      error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
    });
  }

  // filtra por placa, vehículo o código
  get filteredServices(): OperatorServiceRow[] {
    const term = this.vehicleFilter.trim().toLowerCase();
    return this.rows().filter(s =>
      !term || s.vehicle.toLowerCase().includes(term) || s.id.toLowerCase().includes(term));
  }

  private toRow(s: OperatorServiceResponse): OperatorServiceRow {
    const statusColor = s.status === 'IN_PROGRESS' ? 'progress' : s.status === 'COMPLETED' ? 'completed' : 'pending';
    const statusKey = s.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : s.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED';
    return {
      bookingId: s.bookingId,
      id: s.code,
      serviceType: s.services,
      dateTime: `${isoToDisplayDate(s.date)} - ${s.startTime.slice(0, 5)}`,
      vehicle: [s.vehicle, s.plate].filter(Boolean).join(' - '),
      client: s.plate || '—',
      phone: '—',
      status: this.translate.instant('STATUS.' + statusKey),
      statusColor,
      paymentMethod: `$ ${s.total.toLocaleString('es-CO')}`
    };
  }
}
