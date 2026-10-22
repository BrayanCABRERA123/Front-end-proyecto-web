import { Injectable, computed, inject, signal } from '@angular/core';

// sus servicios asignados (operations-service)
import { OperationsApiService, localIsoDate } from '../../../core/services/operations-api';
import { toWorkReservation } from '../../../core/utils/operator-work';
import { Reservation } from '../../../shared/dialogs/reservation-models/reservation.model';
import { OperatorWorkViewModel } from './operator-work.viewmodel';

export type ScheduleTab = 'day' | 'week' | 'completed';

/** Mi Agenda: un mes atrás (terminados) y un mes adelante, por día, por semana o terminados. */
@Injectable()
export class OperatorScheduleViewModel {

  private readonly operations = inject(OperationsApiService);
  private readonly work = inject(OperatorWorkViewModel);

  readonly activeTab = signal<ScheduleTab>('day');
  readonly selectedDate = signal(localIsoDate(new Date()));
  readonly reservations = signal<Reservation[]>([]);

  // cuántos servicios tiene cada día, para marcar el calendario
  readonly servicesByDate = computed(() => {
    const map: Record<string, number> = {};
    for (const r of this.reservations()) {
      map[r.date] = (map[r.date] ?? 0) + 1;
    }
    return map;
  });

  readonly dayReservations = computed(() => this.reservations()
    .filter(r => r.date === this.selectedDate())
    .sort((a, b) => a.time.localeCompare(b.time)));

  readonly weekReservations = computed(() => {
    const { start, end } = weekRange(this.selectedDate());
    return this.reservations()
      .filter(r => r.date >= start && r.date <= end)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  });

  readonly completedReservations = computed(() => this.reservations()
    .filter(r => r.status === 'finalizado')
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));

  readonly visibleList = computed(() => {
    if (this.activeTab() === 'week') return this.weekReservations();
    if (this.activeTab() === 'completed') return this.completedReservations();
    return this.dayReservations();
  });

  readonly totalForDay = computed(() => this.dayReservations().length);
  readonly pendingForDay = computed(() => this.dayReservations().filter(r => r.status === 'pendiente').length);
  readonly inProgressForDay = computed(() => this.dayReservations().filter(r => r.status === 'en_progreso').length);
  readonly completedForDay = computed(() => this.dayReservations().filter(r => r.status === 'finalizado').length);

  readonly viewingToday = computed(() => this.selectedDate() === localIsoDate(new Date()));

  // el siguiente servicio de hoy que aún no empieza su hora
  readonly nextService = computed<Reservation | null>(() => {
    if (!this.viewingToday()) return null;
    const now = Date.now();
    return this.dayReservations()
      .filter(r => r.status !== 'finalizado')
      .filter(r => new Date(`${r.date}T${r.time}`).getTime() >= now)[0] ?? null;
  });

  load(): void {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 30);
    this.operations.myServices(localIsoDate(from), localIsoDate(to)).subscribe({
      next: services => this.reservations.set(services.map(toWorkReservation)),
      error: () => undefined
    });
  }

  changeTab(tab: ScheduleTab): void {
    this.activeTab.set(tab);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  start(reservation: Reservation): void {
    this.work.start(reservation.id, reservation.code, () => this.load());
  }

  finish(reservation: Reservation): void {
    this.work.finish(reservation.id, reservation.code, () => this.load());
  }
}

// lunes y domingo de la semana de esa fecha (aaaa-mm-dd)
function weekRange(dateText: string): { start: string; end: string } {
  const [year, month, day] = dateText.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monday = new Date(date);
  monday.setDate(date.getDate() - (date.getDay() + 6) % 7); // 0 = lunes ... 6 = domingo
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: localIsoDate(monday), end: localIsoDate(sunday) };
}
