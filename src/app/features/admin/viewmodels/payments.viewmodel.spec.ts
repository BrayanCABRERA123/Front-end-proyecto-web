import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { Payment } from '../models/admin.models';
import { PaymentsStore } from '../services/payments-store';
import { PaymentsViewModel } from './payments.viewmodel';

const TODAY = '2026-10-23';

function payment(id: number, status: Payment['status'], changes: Partial<Payment> = {}): Payment {
  return {
    id: String(id), code: `#PAG-${id}`, client: 'Mazda 3 - ABC-123', phone: '—', reference: `REF${id}`, method: 'nequi',
    amount: 20000, date: TODAY, time: '10:00', service: 'Básico', status, bookingCode: `RES-${id}`, vehicle: 'Mazda 3',
    plate: 'ABC-123', scheduleLabel: '', bay: '—', operator: '—', email: '—', bankAccount: '', ...changes,
  } as Payment;
}

describe('PaymentsViewModel (F-02)', () => {
  const payments = signal<Payment[]>([]);
  const store = { payments, today: TODAY, refresh: vi.fn(), review: vi.fn(), refund: vi.fn() };
  const feedback = { success: vi.fn(), error: vi.fn() };
  let vm: PaymentsViewModel;

  beforeEach(() => {
    [store.refresh, store.review, store.refund, feedback.success, feedback.error].forEach(f => f.mockReset());
    payments.set([
      payment(1, 'pending'), payment(2, 'approved', { amount: 30000 }), payment(3, 'approved', { date: '2026-10-20' }),
      payment(4, 'rejected', { method: 'cash', client: 'Kia Picanto - XYZ-987' }),
    ]);
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentsStore, useValue: store },
        { provide: PaymentsApiService, useValue: {} },
        { provide: AuthService, useValue: { user: () => null } },
        { provide: FeedbackService, useValue: feedback },
        PaymentsViewModel,
      ],
    });
    vm = TestBed.inject(PaymentsViewModel);
  });

  it('las tarjetas cuentan pendientes, rechazados y lo aprobado hoy', () => {
    expect(vm.stats).toEqual(expect.objectContaining({
      pending: 1, approvedToday: 1, approvedAmount: 30000, rejected: 1, transactionsCount: 4 }));
  });

  it('filtra por estado, medio y texto, y limpia los filtros', () => {
    vm.statusFilter = 'approved';
    expect(vm.filteredPayments.map(p => p.id)).toEqual(['2', '3']);

    vm.clearFilters();
    vm.methodFilter = 'cash';
    expect(vm.filteredPayments.map(p => p.id)).toEqual(['4']);

    vm.clearFilters();
    vm.search = 'xyz';
    expect(vm.filteredPayments.map(p => p.id)).toEqual(['4']);
    expect(vm.hasActiveFilters).toBe(true);
    vm.clearFilters();
    expect(vm.hasActiveFilters).toBe(false);
  });

  it('el aviso de éxito al aprobar sale solo cuando el servidor aceptó', () => {
    vm.review(payments()[0], 'approved');
    const [, , , onError, onDone] = store.review.mock.calls[0];
    expect(feedback.success).not.toHaveBeenCalled();

    onDone();
    expect(feedback.success).toHaveBeenCalled();
    onError({ status: 409 });
    expect(feedback.error).toHaveBeenCalled();
  });
});
