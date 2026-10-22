import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ReservationsComponent } from './reservations';
import { ReservationsStore } from '../../services/reservations-store';
import { OperatorsStore } from '../../services/operators-store';
import { Booking } from '../../models/admin.models';

const TODAY = '2026-10-21';

function booking(id: number, changes: Partial<Booking>): Booking {
  return {
    id: String(id), code: `RES-00000${id}`, clientUserId: 7, client: 'Ana Ruiz', phone: '', email: '',
    vehicle: 'Mazda 3', plate: 'ABC-123', service: 'Premium', serviceIds: [1], vehicleId: 5, date: TODAY,
    time: '10:00', durationMin: 60, bay: 'Bahía 1', status: 'confirmed', changeable: true, cancellationReason: null,
    operator: null, notes: '', createdAt: '', amount: 40000, ...changes,
  };
}

/** store de prueba: las reservas y cuáles necesitan operario los decide cada prueba */
class FakeReservationsStore {
  readonly list = signal<Booking[]>([]);
  readonly bookings = this.list.asReadonly();
  unassignedIds = new Set<string>();
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly today = TODAY;
  load(): void {}
  byDate(date: string): Booking[] { return this.list().filter(b => b.date === date); }
  isUnassigned(b: Booking): boolean { return this.unassignedIds.has(b.id); }
}

describe('ReservationsComponent (admin)', () => {
  let store: FakeReservationsStore;
  let component: ReservationsComponent;

  beforeEach(() => {
    store = new FakeReservationsStore();
    TestBed.configureTestingModule({
      imports: [ReservationsComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ReservationsStore, useValue: store },
        { provide: OperatorsStore, useValue: { operators: signal([{ name: 'Oscar Ruiz' }]) } }],
    });
    component = TestBed.createComponent(ReservationsComponent).componentInstance;
  });

  it('las tarjetas cuentan solo las reservas de hoy y "sin asignar" sale del store', () => {
    store.list.set([
      booking(1, {}),
      booking(2, { status: 'in_progress', operator: { id: '3', initials: 'OR', name: 'Oscar Ruiz' } }),
      booking(3, { status: 'cancelled' }),
      booking(4, { status: 'completed' }),
      booking(5, { date: '2026-10-22' }),
    ]);
    store.unassignedIds = new Set(['1', '5']);

    expect(component.vm.stats).toEqual({ total: 4, confirmedInProgress: 2, unassigned: 1, cancelled: 1 });
  });

  it('busca por cliente, placa o código y filtra por estado, operario y fecha', () => {
    store.list.set([
      booking(1, { client: 'Ana Ruiz', plate: 'ABC-123' }),
      booking(2, { client: 'Luis Gómez', plate: 'XYZ-987', status: 'cancelled' }),
      booking(3, { client: 'Marta Díaz', plate: 'JKL-456', date: '2026-10-22',
        operator: { id: '3', initials: 'OR', name: 'Oscar Ruiz' } }),
    ]);

    component.vm.searchTerm = 'xyz';
    expect(component.vm.filteredBookings.map(b => b.id)).toEqual(['2']);
    component.vm.searchTerm = 'res-000003';
    expect(component.vm.filteredBookings.map(b => b.id)).toEqual(['3']);

    component.vm.searchTerm = '';
    component.vm.statusFilter = 'confirmed';
    expect(component.vm.filteredBookings.map(b => b.id)).toEqual(['1', '3']);
    component.vm.operatorFilter = 'Oscar Ruiz';
    expect(component.vm.filteredBookings.map(b => b.id)).toEqual(['3']);
    component.vm.operatorFilter = '';
    component.vm.selectedDate = TODAY;
    expect(component.vm.filteredBookings.map(b => b.id)).toEqual(['1']);
    expect(component.vm.hasActiveFilters).toBe(true);
  });

  it('el día de la reserva sale en el idioma de la pantalla', () => {
    TestBed.inject(TranslateService).setTranslation('en', { ADMIN_RESERVATIONS: { TABLE: { TODAY: 'Today' } } });
    TestBed.inject(TranslateService).use('en');

    expect(component.dayLabel(TODAY)).toBe('Today');
    expect(component.dayLabel('2026-10-05')).toBe('05/10/2026');
  });

  it('pagina de a 6 y no se sale de las páginas que existen', () => {
    store.list.set(Array.from({ length: 13 }, (_, i) => booking(i + 1, {})));

    expect(component.vm.totalPages).toBe(3);
    expect(component.vm.pagedBookings.length).toBe(6);
    component.vm.goToPage(3);
    expect(component.vm.pagedBookings.length).toBe(1);
    expect(component.vm.rangeFrom).toBe(13);
    component.vm.goToPage(9);
    expect(component.vm.currentPage).toBe(3);
  });
});
