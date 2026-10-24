import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { OperationsApiService, OperatorServiceResponse, localIsoDate } from '../../../core/services/operations-api';
import { isoToDisplayDate } from '../../../core/utils/booking-display';
import { apiErrorKey } from '../../../core/utils/api-error';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { OperatorWorkViewModel } from './operator-work.viewmodel';

// fila que pintan la tabla y el detalle
export interface OperatorServiceRow {
  bookingId: number;
  id: string;
  serviceType: string;
  dateTime: string;
  vehicle: string;
  client: string;
  status: string;
  statusColor: 'pending' | 'progress' | 'completed';
  // total de la reserva (operations-service no conoce el medio de pago ni el teléfono del cliente)
  total: string;
  startableAt: string | null;
  startableUntil: string | null;
  // B-01: indicaciones del admin para este servicio ('' = sin notas)
  notes: string;
}

/**
 * Servicios asignados al operario (operations-service). Iniciar y finalizar los valida el backend
 * (que sean suyos, que no tenga otro en curso) y mueve también la reserva en booking-service.
 */
@Injectable()
export class AssignedServicesViewModel {

  private readonly operations = inject(OperationsApiService);
  private readonly translate = inject(TranslateService);
  private readonly feedback = inject(FeedbackService);
  private readonly work = inject(OperatorWorkViewModel);

  private readonly rows = signal<OperatorServiceRow[]>([]);

  // filtros de búsqueda
  readonly dateFilter = signal('');
  readonly serviceTypeFilter = signal('');
  readonly vehicleFilter = signal('');
  // A-18: los tipos salen de los servicios cargados (antes solo existía "Todos")
  readonly serviceTypes = computed(() => [
    { value: '', label: 'ASSIGNED_SERVICES.FILTERS.ALL' },
    ...[...new Set(this.rows().map(r => r.serviceType))].sort().map(type => ({ value: type, label: type }))
  ]);

  readonly selectedService = signal<OperatorServiceRow | null>(null);

  // estadísticas calculadas de las reservas cargadas
  readonly stats = computed(() => {
    const rows = this.rows();
    return [
      { value: rows.length, label: 'ASSIGNED_SERVICES.STATS.TOTAL', color: 'total' },
      { value: rows.filter(r => r.statusColor === 'pending').length, label: 'ASSIGNED_SERVICES.STATS.PENDING', color: 'pending' },
      { value: rows.filter(r => r.statusColor === 'progress').length, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS', color: 'progress' },
      { value: rows.filter(r => r.statusColor === 'completed').length, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'completed' }
    ];
  });

  // filtra por tipo de servicio y por placa, vehículo o código
  readonly filteredServices = computed(() => {
    const term = this.vehicleFilter().trim().toLowerCase();
    const type = this.serviceTypeFilter();
    return this.rows().filter(s =>
      (!type || s.serviceType === type)
      && (!term || s.vehicle.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)));
  });

  // carga las del día elegido; sin fecha, las de hoy y los próximos 30 días (lo asignado para mañana también se ve)
  load(): void {
    let from = this.dateFilter();
    let to = this.dateFilter();
    if (!from) {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      from = localIsoDate(new Date());
      to = localIsoDate(end);
    }
    this.operations.myServices(from, to).subscribe({
      next: bookings => {
        const rows = bookings.map(b => this.toRow(b));
        this.rows.set(rows);
        const selected = this.selectedService();
        this.selectedService.set(rows.find(r => r.bookingId === selected?.bookingId) ?? rows[0] ?? null);
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  resetFilters(): void {
    this.dateFilter.set('');
    this.vehicleFilter.set('');
    this.load();
  }

  select(service: OperatorServiceRow): void {
    this.selectedService.set(service);
  }

  // el detalle pide empezar o terminar; el backend valida la transición
  advance(status: 'IN_PROGRESS' | 'COMPLETED'): void {
    const service = this.selectedService();
    if (!service) return;
    if (status === 'IN_PROGRESS') {
      this.work.start(service.bookingId, service.id, () => this.load());
    } else {
      this.work.finish(service.bookingId, service.id, () => this.load());
    }
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
      client: s.clientName || '—',
      status: this.translate.instant('STATUS.' + statusKey),
      statusColor,
      total: `$ ${s.total.toLocaleString('es-CO')}`,
      startableAt: s.startableAt,
      startableUntil: s.startableUntil ?? null,
      notes: (s.notes ?? '').trim()
    };
  }
}
