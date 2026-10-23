import { Injectable, computed, inject, signal } from '@angular/core';

// calificaciones reales que dejaron los clientes (operations-service)
import { OperationsApiService, RatingResponse } from '../../../core/services/operations-api';
import { isoToDisplayDate } from '../../../core/utils/booking-display';
import { todayIso } from '../../../core/utils/dates';

export interface RatingCard {
  id: number;
  client: string;
  serviceType: string;
  date: string;
  isoDate: string;
  rating: number;
  comment: string;
  duration: string;
  serviceId: string;
}

/** Calificaciones del operario con sus estadísticas y filtros. */
@Injectable()
export class QualificationsViewModel {

  private readonly operations = inject(OperationsApiService);

  // tope de los filtros de fecha: no hay historial del futuro
  readonly today = todayIso();

  readonly ratings = signal<RatingCard[]>([]);

  // filtros de búsqueda
  readonly dateFilter = signal('');
  readonly serviceTypeFilter = signal('');
  readonly starsFilter = signal('');

  readonly starOptions = [
    { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
    { value: '5', label: 'QUALIFICATIONS.STARS_5' },
    { value: '4', label: 'QUALIFICATIONS.STARS_4' },
    { value: '3', label: 'QUALIFICATIONS.STARS_3' },
    { value: '2', label: 'QUALIFICATIONS.STARS_2' },
    { value: '1', label: 'QUALIFICATIONS.STARS_1' }
  ];

  // opciones del select: los servicios que aparecen en sus calificaciones
  readonly serviceTypes = computed(() => {
    const names = [...new Set(this.ratings().map(r => r.serviceType))];
    return [{ value: '', label: 'QUALIFICATIONS.TYPE_ALL' }, ...names.map(n => ({ value: n, label: n }))];
  });

  readonly totalRatings = computed(() => this.ratings().length);

  readonly averageRating = computed(() => {
    const list = this.ratings();
    if (list.length === 0) return 0;
    return Math.round((list.reduce((sum, r) => sum + r.rating, 0) / list.length) * 10) / 10;
  });

  // porcentaje de calificaciones de 4 o 5 estrellas
  readonly satisfactionPercentage = computed(() => {
    const list = this.ratings();
    if (list.length === 0) return 0;
    return Math.round((list.filter(r => r.rating >= 4).length / list.length) * 100);
  });

  readonly satisfactionLevel = computed(() =>
    this.ratings().length === 0 ? '—' : `${this.satisfactionPercentage()}%`);

  readonly filteredRatings = computed(() => this.ratings().filter(c => {
    if (this.starsFilter() && c.rating !== parseInt(this.starsFilter())) return false;
    if (this.dateFilter() && c.isoDate !== this.dateFilter()) return false;
    if (this.serviceTypeFilter() && c.serviceType !== this.serviceTypeFilter()) return false;
    return true;
  }));

  load(): void {
    this.operations.myRatings().subscribe({
      next: list => this.ratings.set(list.map(toCard)),
      error: () => undefined
    });
  }

  clearFilters(): void {
    this.dateFilter.set('');
    this.serviceTypeFilter.set('');
    this.starsFilter.set('');
  }
}

function toCard(r: RatingResponse): RatingCard {
  return {
    id: r.bookingId,
    // nombre del cliente y la placa de su vehículo (si no hay nombre, solo la placa)
    client: r.clientName ? `${r.clientName} · ${r.plate}` : r.plate,
    serviceType: r.services,
    date: isoToDisplayDate(r.date),
    isoDate: r.date,
    rating: r.rating,
    comment: r.comment ?? '',
    duration: '',
    serviceId: r.bookingCode
  };
}
