import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { AuthService } from '../../../core/services/auth';
import { PaymentResponse, PaymentsApiService } from '../../../core/services/payments-api';
import { PaymentsStore } from './payments-store';
import { ReservationsStore } from './reservations-store';

const payment = (id: number, status: PaymentResponse['status'], bookingCancelled?: boolean): PaymentResponse => ({
  id, status, amount: 20000, processedAtUtc: null, rejectionReason: null, transactionReference: `REF${id}`,
  reportedAmount: null, receiptImage: null, reportedAtUtc: '2026-10-23T15:00:00Z', reportedBy: 1, account: null,
  booking: null, bookingCancelled,
});

describe('PaymentsStore: pagos de reservas canceladas', () => {
  it('aprobado → reembolsar; en revisión → rechazar; el resto sin aviso', () => {
    const list = [payment(1, 'APPROVED', true), payment(2, 'IN_REVIEW', true), payment(3, 'REJECTED', true),
      payment(4, 'APPROVED', false), payment(5, 'IN_REVIEW')];
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentsApiService, useValue: { adminList: () => of(list) } },
        { provide: AuthService, useValue: { hasAnyRole: () => true } },
        { provide: ReservationsStore, useValue: { bookings: signal([]) } },
      ],
    });
    const store = TestBed.inject(PaymentsStore);
    store.refresh();

    expect(store.payments().map(p => p.cancelledBookingAction)).toEqual(['refund', 'reject', null, null, null]);
  });
});
