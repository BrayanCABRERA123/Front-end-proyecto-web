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
  function answerLoad(bookings: BookingResponse[], assignments: object[], unassigned: number[] | null,
                      toClose: object[] = []): void {
    http.expectOne(r => r.url === '/api/v1/admin/bookings').flush(bookings);
    http.expectOne(r => r.url === '/api/v1/admin/users').flush({ items: [], page: 0, size: 100, totalItems: 0, totalPages: 0 });
    http.expectOne(r => r.url === '/api/v1/admin/assignments').flush(assignments);
    const req = http.expectOne(r => r.url === '/api/v1/admin/assignments/unassigned');
    if (unassigned === null) {
      req.flush({ code: 'SERVICE_UNAVAILABLE' }, { status: 503, statusText: 'Service Unavailable' });
    } else {
      req.flush({ count: unassigned.length, bookingIds: unassigned });
    }
    http.expectOne(r => r.url === '/api/v1/admin/assignments/to-close').flush(toClose);
  }

  it('toma de operations las reservas sin operario (una sola regla)', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(1, 'CONFIRMED', day(1)), booking(2, 'CONFIRMED', day(1), '12:00'), booking(3, 'COMPLETED', day(-1))],
      [], [2]);

    expect(store.unassigned().map(b => b.id)).toEqual(['2']);
    expect(store.isUnassigned(store.getById('1')!)).toBe(false);
    // una terminada sin operario no se cuenta como "sin asignar"
    expect(store.isUnassigned(store.getById('3')!)).toBe(false);
  });

  it('trae el modo de pago que eligió el cliente (null en las reservas del admin)', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([{ ...booking(1, 'CONFIRMED', day(1)), paymentMode: 'CASH' }, booking(2, 'CONFIRMED', day(1), '12:00')], [], []);

    expect(store.getById('1')?.paymentMode).toBe('CASH');
    expect(store.getById('2')?.paymentMode).toBeNull();
  });

  it('si operations no responde, calcula la misma regla con lo que tiene', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(1, 'CONFIRMED', day(1)), booking(2, 'CANCELLED', day(1)), booking(3, 'CONFIRMED', day(-2))],
      [], null);

    expect(store.unassigned().map(b => b.id)).toEqual(['1']);
  });

  it('al asignar un operario la reserva deja de estar sin asignar', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(5, 'CONFIRMED', day(1))], [], [5]);
    let done = false;

    store.assignOperator('5', '3', () => (done = true));
    http.expectOne(r => r.method === 'PUT' && r.url === '/api/v1/admin/assignments/5')
      .flush({ bookingId: 5, operatorId: 3, operatorName: 'Oscar Ruiz', status: 'PENDING', bay: null });

    expect(done).toBe(true);
    expect(store.unassigned()).toEqual([]);
    expect(store.getById('5')!.operator?.name).toBe('Oscar Ruiz');
  });

  it('B-01: las notas del administrador viajan con la asignación', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(5, 'CONFIRMED', day(1))], [], [5]);

    store.assignOperator('5', '3', undefined, '  Llevar cera extra ');
    const request = http.expectOne(r => r.method === 'PUT' && r.url === '/api/v1/admin/assignments/5');

    expect(request.request.body).toEqual({ operatorId: 3, notes: 'Llevar cera extra' });
    request.flush({ bookingId: 5, operatorId: 3, operatorName: 'Oscar Ruiz', status: 'PENDING', bay: null, notes: 'Llevar cera extra' });
  });

  it('lista por cerrar las que operations marca y las saca al cerrarlas', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(8, 'CONFIRMED', day(-1)), booking(9, 'IN_PROGRESS', day(-1), '12:00')], [], [],
      [{ bookingId: 8, reason: 'NOT_STARTED', operatorId: 3 }, { bookingId: 9, reason: 'NOT_FINISHED', operatorId: 3 }]);

    expect(store.toClose().map(item => [item.booking.id, item.reason])).toEqual([['8', 'NOT_STARTED'], ['9', 'NOT_FINISHED']]);

    let closed = false;
    store.closeAsAttended('8').subscribe(() => (closed = true));
    http.expectOne(r => r.method === 'POST' && r.url === '/api/v1/admin/assignments/8/attended').flush(null);

    expect(closed).toBe(true);
    expect(store.getById('8')!.status).toBe('completed');
    expect(store.toClose().map(item => item.booking.id)).toEqual(['9']);
  });

  it('si operations no responde, por cerrar queda vacío y las reservas igual se ven', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    http.expectOne(r => r.url === '/api/v1/admin/bookings').flush([booking(8, 'CONFIRMED', day(-1))]);
    http.expectOne(r => r.url === '/api/v1/admin/users').flush({ items: [], page: 0, size: 100, totalItems: 0, totalPages: 0 });
    http.expectOne(r => r.url === '/api/v1/admin/assignments').flush([]);
    http.expectOne(r => r.url === '/api/v1/admin/assignments/unassigned').flush({ count: 0, bookingIds: [] });
    http.expectOne(r => r.url === '/api/v1/admin/assignments/to-close')
      .flush({ code: 'SERVICE_UNAVAILABLE' }, { status: 503, statusText: 'Service Unavailable' });

    expect(store.toClose()).toEqual([]);
    expect(store.bookings().length).toBe(1);
  });
  it('WEB-16: no carga sola al crearse; la pide cada pantalla al entrar', () => {
    const store = TestBed.inject(ReservationsStore);

    http.expectNone(r => r.url === '/api/v1/admin/bookings');
    // sin carga no hay reservas ni indicador de cargando
    expect(store.bookings()).toEqual([]);
    expect(store.loading()).toBe(false);
  });

  it('WEB-16: el refresco automático no muestra cargando, no se duplica y si falla deja lo que había', () => {
    const store = TestBed.inject(ReservationsStore);
    store.load();
    answerLoad([booking(1, 'CONFIRMED', day(1))], [], []);

    store.load(true);
    // mientras la anterior sigue en curso, otro refresco no pide lo mismo otra vez
    store.load(true);
    expect(store.loading()).toBe(false);
    http.expectOne(r => r.url === '/api/v1/admin/bookings').flush('down', { status: 503, statusText: 'Service Unavailable' });
    // el resto de peticiones quedó cancelado con el fallo
    http.match(() => true);

    expect(store.loadError()).toBeNull();
    expect(store.bookings().map(b => b.id)).toEqual(['1']);
  });
});
