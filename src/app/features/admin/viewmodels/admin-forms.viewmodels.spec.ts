import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../../core/services/booking-api';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { ReservationsStore } from '../services/reservations-store';
import { BookingFormViewModel } from './booking-form.viewmodel';
import { ManualPaymentViewModel } from './manual-payment.viewmodel';
import { PaymentMethodsViewModel } from './payment-methods.viewmodel';

const vehicle = { id: 7, vehicleTypeId: 2, brand: 'Mazda', model: '3', vehicleTypeName: 'Sedán', licensePlateFormatted: 'ABC-123' };
const service = (id: number) => ({ id, name: `S${id}`, prices: [{ price: 20000, estimatedMinutes: 45 }] });

describe('ViewModels de formularios del admin', () => {
  const bookingApi = { vehicleByPlate: vi.fn(), services: vi.fn(), availability: vi.fn(), adminBookings: vi.fn() };
  const paymentsApi = { adminAccounts: vi.fn(), amountDue: vi.fn(), updateAccount: vi.fn() };
  const store = { create: vi.fn(), reschedule: vi.fn() };
  const feedback = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(() => {
    [bookingApi, paymentsApi, store, feedback].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    bookingApi.vehicleByPlate.mockReturnValue(of([{ vehicle }]));
    bookingApi.services.mockReturnValue(of([service(1), service(2)]));
    bookingApi.availability.mockReturnValue(of({ open: true, slots: [{ time: '09:00', available: true }, { time: '09:30', available: false }] }));
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: bookingApi },
        { provide: PaymentsApiService, useValue: paymentsApi },
        { provide: ReservationsStore, useValue: store },
        { provide: FeedbackService, useValue: feedback },
        BookingFormViewModel, ManualPaymentViewModel, PaymentMethodsViewModel,
      ],
    });
  });

  it('Reserva del admin: busca por placa, ofrece solo horas libres y si se ocupa propone otras', () => {
    const vm = TestBed.inject(BookingFormViewModel);
    vm.setPlate('abc123');
    vm.searchVehicle();
    vm.toggleService(1);

    expect(bookingApi.vehicleByPlate).toHaveBeenCalledWith('ABC123');
    expect(vm.times()).toEqual(['09:00']);
    vm.time.set('09:00');
    expect(vm.canSave()).toBe(true);

    store.create.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { code: 'SLOT_UNAVAILABLE', reason: 'NO_FREE_BAY', alternatives: ['10:00'] },
    })));
    const saved = vi.fn();
    vm.save(saved);

    expect(saved).not.toHaveBeenCalled();
    expect(vm.times()).toEqual(['10:00']);
    expect(vm.saveErrorKey()).toBe('RESERVE.SLOT_TAKEN_MESSAGE');
    expect(vm.saving()).toBe(false);
  });

  it('Pago en el local: propone efectivo y no adivina el monto si payment-service no responde', () => {
    bookingApi.adminBookings.mockReturnValue(of([]));
    paymentsApi.adminAccounts.mockReturnValue(of([
      { id: 1, methodCode: 'NEQUI', active: true }, { id: 2, methodCode: 'EFECTIVO', active: true },
    ]));
    paymentsApi.amountDue.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const vm = TestBed.inject(ManualPaymentViewModel);
    vm.load();

    expect(vm.accountId()).toBe(2);
    vm.selectBooking(9);
    expect(vm.amountLabel()).toBe('—');
    expect(vm.result()).toEqual({ bookingId: 9, paymentAccountId: 2, transactionReference: null });
  });

  it('Medios de pago: un QR que no es PNG ni JPG no se sube', async () => {
    const vm = TestBed.inject(PaymentMethodsViewModel);
    const svg = new File(['<svg/>'], 'qr.svg', { type: 'image/svg+xml' });

    const accepted = await vm.uploadQr({ id: '1', name: 'Nequi' } as never, svg);

    expect(accepted).toBe(false);
    expect(paymentsApi.updateAccount).not.toHaveBeenCalled();
    expect(feedback.error).toHaveBeenCalledWith('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.INVALID_FILE_MESSAGE');
  });
});
