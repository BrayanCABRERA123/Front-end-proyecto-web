import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ReservationsStore } from './reservations-store';
import { BookingResponse } from '../../../core/models/booking.models';

/** fecha local yyyy-MM-dd con un desfase en días respecto a hoy */
function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function booking(id: number, status: BookingResponse['status'], date: string, time = '10:00'): BookingResponse {
  return {
    id, code: `RES-${String(id).padStart(6, '0')}`, status, date, startTime: time, endTime: '11:00', durationMinutes: 60,
    scheduledStart: `${date}T${time}:00`, scheduledEnd: `${date}T11:00:00`, bay: { id: 1, code: 'BAY-01', name: 'Bahía 1' },
    vehicle: null, ownerUserId: 7, bookedBy: 7, services: [{ servicePriceId: 1, serviceId: 1, code: 'PREMIUM', name: 'Premium',
      price: 40000, estimatedMinutes: 60, quantity: 1, subtotal: 40000 }],
    subtotal: 40000, pointsDiscountAmount: 0, total: 40000, cancellationReason: null, notes: null, changeable: true,
    createdAt: null,
  } as unknown as BookingResponse;
}

describe('ReservationsStore', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** responde la carga inicial; unassigned null simula que operations no contestó */
  function answerLoad(bookings: BookingResponse[], assignments: object[], unassigned: number[] | null): void {
    http.expectOne(r => r.url === '/api/v1/admin/bookings').flush(bookings);
    http.expectOne(r => r.url === '/api/v1/admin/users').flush({ items: [], page: 0, size: 100, totalItems: 0, totalPages: 0 });
    http.expectOne(r => r.url === '/api/v1/admin/assignments').flush(assignments);
    const req = http.expectOne(r => r.url === '/api/v1/admin/assignments/unassigned');
    if (unassigned === null) {
      req.flush({ code: 'SERVICE_UNAVAILABLE' }, { status: 503, statusText: 'Service Unavailable' });
    } else {
      req.flush({ count: unassigned.length, bookingIds: unassigned });
    }
  }

  it('toma de operations las reservas sin operario (una sola regla)', () => {
    const store = TestBed.inject(ReservationsStore);
    answerLoad([booking(1, 'CONFIRMED', day(1)), booking(2, 'CONFIRMED', day(1), '12:00'), booking(3, 'COMPLETED', day(-1))],
      [], [2]);

    expect(store.unassigned().map(b => b.id)).toEqual(['2']);
    expect(store.isUnassigned(store.getById('1')!)).toBe(false);
    // una terminada sin operario no se cuenta como "sin asignar"
    expect(store.isUnassigned(store.getById('3')!)).toBe(false);
  });

  it('si operations no responde, calcula la misma regla con lo que tiene', () => {
    const store = TestBed.inject(ReservationsStore);
    answerLoad([booking(1, 'CONFIRMED', day(1)), booking(2, 'CANCELLED', day(1)), booking(3, 'CONFIRMED', day(-2))],
      [], null);

    expect(store.unassigned().map(b => b.id)).toEqual(['1']);
  });

  it('al asignar un operario la reserva deja de estar sin asignar', () => {
    const store = TestBed.inject(ReservationsStore);
    answerLoad([booking(5, 'CONFIRMED', day(1))], [], [5]);
    let done = false;

    store.assignOperator('5', '3', () => (done = true));
    http.expectOne(r => r.method === 'PUT' && r.url === '/api/v1/admin/assignments/5')
      .flush({ bookingId: 5, operatorId: 3, operatorName: 'Oscar Ruiz', status: 'PENDING', bay: null });

    expect(done).toBe(true);
    expect(store.unassigned()).toEqual([]);
    expect(store.getById('5')!.operator?.name).toBe('Oscar Ruiz');
  });
});
