import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../../core/services/booking-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { Booking } from '../models/admin.models';
import { OperatorsStore } from '../services/operators-store';
import { ReservationsStore } from '../services/reservations-store';
import { ReservationsViewModel } from './reservations.viewmodel';

describe('ReservationsViewModel (motivo de cancelación, A-20)', () => {
  const store = { setStatus: vi.fn(), load: vi.fn() };
  const bookingApi = { cancellationReasons: vi.fn() };
  let vm: ReservationsViewModel;
  const booking = { id: '7', code: 'RES-7' } as Booking;

  beforeEach(() => {
    [...Object.values(store), ...Object.values(bookingApi)].forEach(f => f.mockReset());
    store.setStatus.mockReturnValue(of({}));
    bookingApi.cancellationReasons.mockReturnValue(of([
      { code: 'CUSTOMER_REQUEST', name: 'El cliente la canceló' }, { code: 'SHOP_ISSUE', name: 'Imprevisto del lavadero' }]));
    TestBed.configureTestingModule({
      providers: [
        { provide: ReservationsStore, useValue: store },
        { provide: OperatorsStore, useValue: {} },
        { provide: BookingApiService, useValue: bookingApi },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        ReservationsViewModel,
      ],
    });
    vm = TestBed.inject(ReservationsViewModel);
  });

  it('carga los motivos del servidor para elegir al cancelar', () => {
    vm.loadCancellationReasons();

    expect(vm.cancellationReasons().map(r => r.code)).toEqual(['CUSTOMER_REQUEST', 'SHOP_ISSUE']);
  });

  it('cancela con el motivo elegido (antes siempre era OTHER)', () => {
    vm.changeStatus(booking, 'cancelled', 'SHOP_ISSUE');
    expect(store.setStatus).toHaveBeenCalledWith('7', 'cancelled', 'SHOP_ISSUE');

    vm.changeStatus(booking, 'cancelled');
    expect(store.setStatus).toHaveBeenLastCalledWith('7', 'cancelled', 'OTHER');

    vm.changeStatus(booking, 'completed', 'SHOP_ISSUE');
    expect(store.setStatus).toHaveBeenLastCalledWith('7', 'completed', undefined);
  });
});
