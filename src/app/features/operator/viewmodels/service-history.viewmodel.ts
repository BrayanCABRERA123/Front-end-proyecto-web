import { Injectable, computed, inject, signal } from '@angular/core';

// servicios que ya hizo (operations-service)
import { OperationsApiService, localIsoDate } from '../../../core/services/operations-api';
import { todayIso } from '../../../core/utils/dates';
import { ServiceHistoryItem } from '../../../shared/dialogs/history-models/service-history.model';

// estos 3 valores coinciden con HistoryStatus (shared/dialogs/history-models), no se traducen aquí
export type HistoryTab = 'todos' | 'finalizado' | 'cancelado' | 'reasignado';

/** Historial del operario: servicios terminados de los últimos 60 días con su calificación. */
// reserva cancelada o en la que el cliente no llegó (estado de booking-service)
function isCancelledBooking(status: string): boolean {
  return status === 'CANCELLED' || status === 'NO_SHOW';
}

@Injectable()
export class ServiceHistoryViewModel {

  private readonly operations = inject(OperationsApiService);

  // tope de los filtros de fecha: no hay historial del futuro
  readonly today = todayIso();

  readonly services = signal<ServiceHistoryItem[]>([]);

  readonly activeTab = signal<HistoryTab>('todos');
  readonly search = signal('');
  readonly dateFilter = signal('');
  readonly serviceFilter = signal('');

  // nombres de servicio que aparecen en su historial (salen de los datos)
  readonly serviceTypes = computed(() => [...new Set(this.services().map(s => s.service))]);

  readonly completed = computed(() => this.services().filter(s => s.status === 'finalizado').length);
  readonly canceledOrReassigned = computed(() => this.services().filter(s => s.status !== 'finalizado').length);
  readonly totalGenerated = computed(() => this.services()
    .filter(s => s.status === 'finalizado')
    .reduce((sum, s) => sum + s.amount, 0));

  readonly averageRating = computed(() => {
    const rated = this.services().filter(s => s.rating !== null);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((total, s) => total + (s.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  });

  readonly completionRate = computed(() => this.services().length === 0
    ? 0 : Math.round((this.completed() / this.services().length) * 100));

  readonly filteredServices = computed(() => {
    const text = this.search().trim().toLowerCase();
    const tab = this.activeTab();
    return this.services().filter(s => {
      if (tab !== 'todos' && s.status !== tab) return false;
      if (this.dateFilter() && s.date !== this.dateFilter()) return false;
      if (this.serviceFilter() && s.service !== this.serviceFilter()) return false;
      if (!text) return true;
      // vehículo y servicio ya vienen con su nombre real desde el backend
      return s.code.toLowerCase().includes(text) ||
        s.plate.toLowerCase().includes(text) ||
        s.client.toLowerCase().includes(text) ||
        (s.vehicle ?? '').toLowerCase().includes(text) ||
        (s.service ?? '').toLowerCase().includes(text);
    });
  });

  // servicios de los últimos 60 días, del más nuevo al más antiguo. A-18: el estado sale de los datos:
  // terminado (la ejecución se completó) o cancelado (la reserva se canceló o el cliente no llegó);
  // lo pendiente o en curso no es historial. Medio de pago no hay: operations-service no lo conoce
  load(): void {
    const from = new Date();
    from.setDate(from.getDate() - 60);
    this.operations.myServices(localIsoDate(from), localIsoDate(new Date())).subscribe({
      next: list => this.services.set(list
        .filter(s => s.status === 'COMPLETED' || isCancelledBooking(s.bookingStatus))
        .map((s, i) => ({
          id: s.bookingId ?? i,
          code: s.code,
          date: s.date,
          time: s.startTime.slice(0, 5),
          service: s.services,
          vehicle: s.vehicle,
          plate: s.plate,
          // A-18: el primer nombre del cliente (antes se repetía la placa)
          client: s.clientName || '—',
          paymentMethod: '',
          amount: s.total,
          rating: s.rating,
          comment: s.comment,
          status: s.status === 'COMPLETED' ? 'finalizado' : 'cancelado',
          reason: null
        } as ServiceHistoryItem))
        .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))),
      error: () => undefined
    });
  }

  countTab(tab: HistoryTab): number {
    if (tab === 'todos') return this.services().length;
    return this.services().filter(s => s.status === tab).length;
  }

  changeTab(tab: HistoryTab): void {
    this.activeTab.set(tab);
  }

  clearFilters(): void {
    this.search.set('');
    this.dateFilter.set('');
    this.serviceFilter.set('');
    this.activeTab.set('todos');
  }
}
