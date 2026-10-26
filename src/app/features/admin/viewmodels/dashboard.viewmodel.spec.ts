import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth';
import { BookingApiService } from '../../../core/services/booking-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { Booking, Operator, Payment } from '../models/admin.models';
import { OperatorsStore } from '../services/operators-store';
import { PaymentsStore } from '../services/payments-store';
import { ReservationsStore } from '../services/reservations-store';
import { ScheduleStore } from '../services/schedule-store';
import { AdminDashboardViewModel } from './dashboard.viewmodel';

const TODAY = '2026-10-23';

describe('AdminDashboardViewModel (F-02)', () => {
  const bookings: Partial<Booking>[] = [
    { id: '1', date: TODAY, status: 'in_progress' }, { id: '2', date: TODAY, status: 'confirmed' },
    { id: '3', date: '2026-10-22', status: 'in_progress' },
  ];
  const payments = signal<Partial<Payment>[]>([
    { id: '1', status: 'approved', amount: 30000, date: TODAY }, { id: '2', status: 'approved', amount: 10000, date: '2026-10-22' },
    { id: '3', status: 'pending', amount: 50000, date: TODAY },
  ]);
  const operators = signal<Operator[]>([]);
  const bookingApi = { daySummary: vi.fn() };
  let vm: AdminDashboardViewModel;

  beforeEach(() => {
    bookingApi.daySummary.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { user: () => ({ firstName: 'Ana' }) } },
        { provide: BookingApiService, useValue: bookingApi },
        { provide: ReservationsStore, useValue: { today: TODAY, load: vi.fn(),
          byDate: (date: string) => bookings.filter(b => b.date === date) } },
        { provide: PaymentsStore, useValue: { payments, today: TODAY, refresh: vi.fn(),
          pendingPayments: () => payments().filter(p => p.status === 'pending') } },
        { provide: OperatorsStore, useValue: { operators, refresh: vi.fn() } },
        { provide: ScheduleStore, useValue: { load: vi.fn(), bays: () => [{ status: 'active' }, { status: 'maintenance' }] } },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        AdminDashboardViewModel,
      ],
    });
    vm = TestBed.inject(AdminDashboardViewModel);
  });

  it('las tarjetas resumen usan los datos de hoy', () => {
    expect(vm.adminName).toBe('Ana');
    expect(vm.bookingsToday).toBe(2);
    expect(vm.servicesInProgress).toBe(1);
    expect(vm.activeBays).toBe(1);
    expect(vm.pendingPaymentsCount).toBe(1);
    expect(vm.revenueToday).toBe(30000);
  });

  it('con el resumen de booking-service muestra la diferencia frente a ayer', () => {
    bookingApi.daySummary.mockReturnValue(of({ date: TODAY, bookings: 5, previousDayBookings: 8, difference: -3 }));
    vm.load();

    expect(vm.bookingsToday).toBe(5);
    expect(vm.vsYesterdayAbs).toBe(3);
    expect(vm.vsDirection).toBe('↘');
  });

  it('la lista de pagos por revisar muestra solo los pendientes', () => {
    expect(vm.pendingPayments.map(p => p.id)).toEqual(['3']);
  });
});
