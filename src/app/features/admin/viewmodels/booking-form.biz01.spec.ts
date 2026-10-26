import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../../core/services/booking-api';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { Booking } from '../models/admin.models';
import { ReservationsStore } from '../services/reservations-store';
import { BookingFormViewModel } from './booking-form.viewmodel';

// BIZ-01: reprogramar desde el admin una reserva que ya tiene un pago
describe('BookingFormViewModel: servicios de una reserva con pago (BIZ-01)', () => {
  const paymentsApi = { adminList: vi.fn() };
  const booking = { id: '7', plate: 'ABC123', date: '2099-01-10', notes: '', serviceIds: [1] } as unknown as Booking;

  beforeEach(() => {
    paymentsApi.adminList.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: { vehicleByPlate: () => of([]), services: () => of([]), availability: () => of({ open: true, slots: [] }) } },
        { provide: PaymentsApiService, useValue: paymentsApi },
        { provide: ReservationsStore, useValue: {} },
        BookingFormViewModel,
      ],
    });
  });

  it('avisa solo si la reserva tiene un pago en revisión o aprobado y el admin cambia los servicios', () => {
    paymentsApi.adminList.mockReturnValue(of([{ id: 3, status: 'IN_REVIEW', booking: { id: 7 } }, { id: 4, status: 'APPROVED', booking: { id: 9 } }]));
    const vm = TestBed.inject(BookingFormViewModel);
    vm.init(booking);

    expect(vm.hasPayment()).toBe(true);
    expect(vm.servicesChangeWarning()).toBe(false);
    vm.toggleService(2);
    expect(vm.servicesChangeWarning()).toBe(true);
    vm.toggleService(2);
    expect(vm.servicesChangeWarning()).toBe(false);
  });

  it('sin pago vigente (o rechazado) no avisa', () => {
    paymentsApi.adminList.mockReturnValue(of([{ id: 3, status: 'REJECTED', booking: { id: 7 } }]));
    const vm = TestBed.inject(BookingFormViewModel);
    vm.init(booking);
    vm.toggleService(2);

    expect(vm.servicesChangeWarning()).toBe(false);
  });

  it('si payment-service no responde no inventa el aviso', () => {
    paymentsApi.adminList.mockReturnValue(throwError(() => new Error('down')));
    const vm = TestBed.inject(BookingFormViewModel);
    vm.init(booking);
    vm.toggleService(2);

    expect(vm.servicesChangeWarning()).toBe(false);
  });
});
