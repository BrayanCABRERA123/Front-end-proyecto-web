import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../../core/services/booking-api';
import { VehiclesService } from '../../../core/services/vehicles';
import { LoyaltyApiService } from '../../../core/services/loyalty-api';
import { OperationsApiService, localIsoDate } from '../../../core/services/operations-api';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { ClientDashboardViewModel } from './dashboard.viewmodel';
import { ClientHistoryViewModel } from './history.viewmodel';
import { ReserveViewModel } from './reserve.viewmodel';

const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return localIsoDate(d); })();

const booking = (id: number, status: string, date: string, changes: object = {}) => ({
  id, code: `RES-${id}`, status, date, startTime: '09:00', endTime: '09:45', subtotal: 20000, total: 20000,
  pointsDiscountAmount: 0, services: [{ name: 'Básico' }],
  vehicle: { brand: 'Mazda', model: '3', licensePlateFormatted: 'ABC-123', vehicleTypeName: 'Sedán' }, ...changes,
});

describe('ViewModels del cliente', () => {
  const bookingApi = { myBookings: vi.fn(), establishment: vi.fn(), cancelMyBooking: vi.fn(), createBooking: vi.fn() };
  const vehicles = { list: vi.fn() };
  const loyalty = { balance: vi.fn(), promotions: vi.fn() };
  const operations = { myBookingOperators: vi.fn(), givenRatings: vi.fn(), rate: vi.fn() };
  const payments = { myBookings: vi.fn() };
  const feedback = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    [bookingApi, vehicles, loyalty, operations, payments, feedback].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    bookingApi.establishment.mockReturnValue(of({ address: 'Calle 1', tradeName: 'Sede' }));
    vehicles.list.mockReturnValue(of([{ id: 3, vehicleTypeId: 2 }, { id: 4, vehicleTypeId: 2 }]));
    operations.myBookingOperators.mockReturnValue(of([{ bookingId: 2, operatorName: 'Oscar' }]));
    operations.givenRatings.mockReturnValue(of([]));
    payments.myBookings.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: bookingApi },
        { provide: VehiclesService, useValue: vehicles },
        { provide: LoyaltyApiService, useValue: loyalty },
        { provide: OperationsApiService, useValue: operations },
        { provide: PaymentsApiService, useValue: payments },
        { provide: FeedbackService, useValue: feedback },
        ClientDashboardViewModel, ClientHistoryViewModel, ReserveViewModel,
      ],
    });
  });

  it('Dashboard: cuenta activas, vehículos y lavados, con el próximo servicio y su operario', () => {
    bookingApi.myBookings.mockReturnValue(of([
      booking(1, 'COMPLETED', '2026-10-01'), booking(2, 'CONFIRMED', tomorrow), booking(3, 'CANCELLED', tomorrow),
    ]));
    loyalty.balance.mockReturnValue(of({ points: 30 }));
    loyalty.promotions.mockReturnValue(of([
      { name: 'Lavado gratis', discountPercent: 0, requiredPoints: 50, unlocked: false },
      { name: 'Cera', discountPercent: 10, requiredPoints: 20, unlocked: true },
    ]));
    const vm = TestBed.inject(ClientDashboardViewModel);

    vm.load();

    expect(vm.stats().map(s => s.value)).toEqual([1, 2, 1]);
    expect(vm.nextService()?.id).toBe(2);
    expect(vm.nextService()?.operator).toBe('Oscar');
    expect(vm.loyalty()).toEqual({ current: 30, goal: 50, percentage: 60 });
    expect(vm.benefits()).toEqual([
      { title: 'Lavado gratis', unlocked: false, pointsLeft: 20 },
      { title: 'Cera · 10% OFF', unlocked: true, pointsLeft: -10 },
    ]);
  });

  it('Historial: filtra por estado y la calificación nueva aparece sin recargar', () => {
    bookingApi.myBookings.mockReturnValue(of([booking(1, 'COMPLETED', '2026-10-01'), booking(2, 'CONFIRMED', tomorrow)]));
    operations.rate.mockReturnValue(of({ rating: 5, comment: 'Excelente' }));
    const vm = TestBed.inject(ClientHistoryViewModel);
    vm.load();

    vm.activeFilter.set('completadas');
    expect(vm.filteredBookings().map(b => b.id)).toEqual([1]);

    vm.rate(vm.filteredBookings()[0], 5, 'Excelente');
    expect(operations.rate).toHaveBeenCalledWith(1, 5, 'Excelente');
    expect(vm.bookings().find(b => b.id === 1)?.rating).toBe(5);
    expect(feedback.success).toHaveBeenCalledWith('RATINGS.SUCCESS_TITLE', 'RATINGS.SUCCESS_MESSAGE');
  });

  it('Reservar: si la hora ya no sirve, ofrece las horas libres que propone el backend', () => {
    const vm = TestBed.inject(ReserveViewModel);
    vm.load();
    vm.selectedVehicleId.set(3);
    vm.selectedServiceId.set(5);
    vm.date.set(tomorrow);
    vm.time.set('09:00');
    bookingApi.createBooking.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { code: 'SLOT_UNAVAILABLE', reason: 'NO_FREE_BAY', alternatives: ['10:00', '10:30'] },
    })));
    const created = vi.fn();

    vm.submit(created);

    expect(created).not.toHaveBeenCalled();
    expect(vm.submitting()).toBe(false);
    expect(vm.time()).toBe('');
    expect(vm.availableTimes()).toEqual(['10:00', '10:30']);
    expect(feedback.error).toHaveBeenCalledWith('RESERVE.SLOT_TAKEN_TITLE', 'RESERVE.SLOT_TAKEN_MESSAGE');
  });
});
