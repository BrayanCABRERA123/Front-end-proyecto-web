import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../../core/services/booking-api';
import { BookingResponse } from '../../../core/models/booking.models';
import { LoyaltyApiService } from '../../../core/services/loyalty-api';
import { PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { PaymentViewModel } from './payment.viewmodel';

describe('PaymentViewModel (cupón)', () => {
  const loyalty = { redeem: vi.fn(), removeRedemption: vi.fn() };
  let vm: PaymentViewModel;

  beforeEach(() => {
    Object.values(loyalty).forEach(f => f.mockReset());
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: {} },
        { provide: PaymentsApiService, useValue: {} },
        { provide: LoyaltyApiService, useValue: loyalty },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        PaymentViewModel,
      ],
    });
    vm = TestBed.inject(PaymentViewModel);
    vm.booking.set({ id: 7 } as BookingResponse);
    vm.serviceSummary.set({ serviceName: 'Lavado', vehicleModel: 'Mazda 3', plate: 'ABC-123', schedule: '', subtotal: 40000, pointsDiscount: 0 });
    loyalty.redeem.mockReturnValue(of({ promotionId: 1, promotionCode: 'VERANO10', promotionName: 'Verano', discountAmount: 4000, newTotal: 36000 }));
    vm.couponCode.set('verano10');
    vm.redeemCoupon();
  });

  it('E-08: quitar el cupón lo anula en el servidor y toma el monto que devuelve', () => {
    // el servidor manda: si su cifra difiere de la que calcula la pantalla, se muestra la suya
    loyalty.removeRedemption.mockReturnValue(of({ bookingId: 7, bookingTotal: 40000, appliedDiscounts: 0, amountDue: 39000 }));

    vm.removeCoupon();

    expect(loyalty.removeRedemption).toHaveBeenCalledWith(7, 1);
    expect(vm.couponResult()).toBeNull();
    expect(vm.totalToPay()).toBe(39000);
  });

  it('E-08: si el servidor no deja quitarlo (pago en revisión), el cupón sigue aplicado', () => {
    loyalty.removeRedemption.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { code: 'PAYMENT_ALREADY_REPORTED' } })));

    vm.removeCoupon();

    expect(vm.couponResult()?.promotionId).toBe(1);
    expect(vm.totalToPay()).toBe(36000);
    expect(vm.couponError()).not.toBeNull();
  });
});
