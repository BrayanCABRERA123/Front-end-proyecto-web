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

describe('PaymentViewModel (monto del servidor, BIZ-02)', () => {
  const loyalty = { bookingRedemption: vi.fn(), redeem: vi.fn(), removeRedemption: vi.fn() };
  const booking = {
    id: 7, code: 'RES-7', status: 'CONFIRMED', date: '2099-10-23', startTime: '09:00', endTime: '09:45',
    subtotal: 40000, pointsDiscountAmount: 0, services: [{ name: 'Básico' }], vehicle: null,
  } as unknown as BookingResponse;
  let vm: PaymentViewModel;

  beforeEach(() => {
    Object.values(loyalty).forEach(f => f.mockReset());
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: { myBookings: () => of([booking]), establishment: () => of({}) } },
        { provide: PaymentsApiService, useValue: { accounts: () => of([]), mine: () => of([]) } },
        { provide: LoyaltyApiService, useValue: loyalty },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        PaymentViewModel,
      ],
    });
    vm = TestBed.inject(PaymentViewModel);
  });

  it('al abrir (o recargar) muestra el cupón ya aplicado y el monto que dice el servidor', () => {
    loyalty.bookingRedemption.mockReturnValue(of({
      bookingId: 7, bookingTotal: 40000, appliedDiscounts: 4000, amountDue: 36000,
      redemption: { promotionId: 3, promotionCode: 'BIENVENIDA10', promotionName: 'Bienvenida 10 %', discountAmount: 4000 },
    }));

    vm.init(7);

    expect(loyalty.bookingRedemption).toHaveBeenCalledWith(7);
    expect(vm.totalToPay()).toBe(36000);
    expect(vm.couponResult()?.promotionId).toBe(3);
    expect(vm.couponResult()?.promotionCode).toBe('BIENVENIDA10');
  });

  it('nunca calcula el total: usa el del servidor aunque no cuadre con el subtotal', () => {
    loyalty.bookingRedemption.mockReturnValue(of({ bookingId: 7, bookingTotal: 38000, appliedDiscounts: 0, amountDue: 38000, redemption: null }));

    vm.init(7);

    expect(vm.totalToPay()).toBe(38000);
    expect(vm.couponResult()).toBeNull();
  });

  it('si payment-service no responde, no inventa un total y avisa', () => {
    loyalty.bookingRedemption.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

    vm.init(7);

    expect(vm.totalToPay()).toBeNull();
    expect(vm.amountDueFailed()).toBe(true);
    expect(vm.isPaidAmountValid()).toBe(false);
  });

  it('quitar el cupón traído al abrir llama al DELETE con su promoción', () => {
    loyalty.bookingRedemption.mockReturnValue(of({
      bookingId: 7, bookingTotal: 40000, appliedDiscounts: 4000, amountDue: 36000,
      redemption: { promotionId: 3, promotionCode: 'BIENVENIDA10', promotionName: 'Bienvenida 10 %', discountAmount: 4000 },
    }));
    loyalty.removeRedemption.mockReturnValue(of({ bookingId: 7, bookingTotal: 40000, appliedDiscounts: 0, amountDue: 40000 }));
    vm.init(7);

    vm.removeCoupon();

    expect(loyalty.removeRedemption).toHaveBeenCalledWith(7, 3);
    expect(vm.couponResult()).toBeNull();
    expect(vm.totalToPay()).toBe(40000);
  });

  it('si el servidor dice que ya hay un cupón, lo trae para poder quitarlo', () => {
    loyalty.bookingRedemption.mockReturnValueOnce(of({ bookingId: 7, bookingTotal: 40000, appliedDiscounts: 0, amountDue: 40000, redemption: null }));
    vm.init(7);
    loyalty.redeem.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'PROMOTION_ONE_PER_BOOKING' } })));
    loyalty.bookingRedemption.mockReturnValueOnce(of({
      bookingId: 7, bookingTotal: 40000, appliedDiscounts: 4000, amountDue: 36000,
      redemption: { promotionId: 3, promotionCode: 'BIENVENIDA10', promotionName: 'Bienvenida 10 %', discountAmount: 4000 },
    }));
    vm.couponCode.set('verano10');

    vm.redeemCoupon();

    expect(loyalty.bookingRedemption).toHaveBeenCalledTimes(2);
    expect(vm.couponResult()?.promotionId).toBe(3);
    expect(vm.totalToPay()).toBe(36000);
  });
});

describe('PaymentViewModel (plazo del pago digital)', () => {
  let vm: PaymentViewModel;
  // 14:30 en la hora local del navegador, sin depender de su zona horaria
  const deadline = new Date(2099, 9, 23, 14, 30).toISOString();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: {} },
        { provide: PaymentsApiService, useValue: {} },
        { provide: LoyaltyApiService, useValue: {} },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        PaymentViewModel,
      ],
    });
    vm = TestBed.inject(PaymentViewModel);
  });

  const withBooking = (changes: Partial<BookingResponse>) =>
    vm.booking.set({ id: 7, status: 'CONFIRMED', paymentMode: 'DIGITAL', paymentDeadline: deadline, paymentReported: false, ...changes } as BookingResponse);

  it('avisa hasta qué hora (local) hay que subir el comprobante', () => {
    withBooking({});
    expect(vm.payBefore()).toBe('14:30');
    expect(vm.isCashBooking()).toBe(false);
  });

  it('no avisa si el comprobante ya se reportó, si se envió desde aquí o si la reserva no está activa', () => {
    withBooking({ paymentReported: true });
    expect(vm.payBefore()).toBeNull();

    withBooking({ status: 'CANCELLED' });
    expect(vm.payBefore()).toBeNull();

    withBooking({});
    vm.flowStep.set('VERIFYING');
    expect(vm.payBefore()).toBeNull();
  });

  it('las reservas en efectivo o anteriores al cambio no tienen plazo', () => {
    withBooking({ paymentMode: 'CASH', paymentDeadline: null });
    expect(vm.payBefore()).toBeNull();
    expect(vm.isCashBooking()).toBe(true);

    withBooking({ paymentMode: null, paymentDeadline: null, paymentReported: undefined });
    expect(vm.payBefore()).toBeNull();
    expect(vm.isCashBooking()).toBe(false);
  });
});

describe('PaymentViewModel (medios según el modo de pago de la reserva)', () => {
  const account = (id: number, methodCode: string, requiresReceipt: boolean) =>
    ({ id, methodCode, methodName: methodCode, accountHolder: 'Lavadero', accountNumber: null, qrImageUrl: null, requiresReceipt });
  const accounts = [account(1, 'NEQUI', true), account(2, 'TRANSFERENCIA', true), account(3, 'EFECTIVO', false)];
  // el medio elegido se guarda por código de reserva: cada prueba empieza sin lo de la anterior
  beforeEach(() => localStorage.clear());

  function vmFor(paymentMode: 'DIGITAL' | 'CASH' | null, active = accounts): PaymentViewModel {
    const booking = { id: 7, code: 'RES-7', status: 'CONFIRMED', date: '2099-10-23', startTime: '09:00', endTime: '09:45',
      subtotal: 40000, pointsDiscountAmount: 0, services: [{ name: 'Básico' }], vehicle: null, paymentMode } as unknown as BookingResponse;
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: { myBookings: () => of([booking]), establishment: () => of({}) } },
        { provide: PaymentsApiService, useValue: { accounts: () => of(active), mine: () => of([]) } },
        { provide: LoyaltyApiService, useValue: { bookingRedemption: () => of({ amountDue: 40000, redemption: null }) } },
        { provide: FeedbackService, useValue: { success: vi.fn(), error: vi.fn() } },
        PaymentViewModel,
      ],
    });
    const vm = TestBed.inject(PaymentViewModel);
    vm.init(7);
    return vm;
  }

  it('con una reserva DIGITAL no ofrece efectivo, solo las cuentas que piden comprobante', () => {
    const vm = vmFor('DIGITAL');
    expect(vm.paymentMethods().map(m => m.id)).toEqual(['NEQUI', 'TRANSFER']);
    expect(vm.selectedMethod()).not.toBe('CASH');
  });

  it('una reserva CASH abre con Efectivo preseleccionado, no con Nequi', () => {
    const vm = vmFor('CASH');
    expect(vm.selectedMethod()).toBe('CASH');
    expect(vm.noMethodSelected()).toBe(false);
    expect(vm.isSelected(vm.paymentMethods().find(m => m.id === 'NEQUI')!)).toBe(false);
  });

  it('una reserva CASH sin cuenta de efectivo activa no preselecciona nada', () => {
    const vm = vmFor('CASH', accounts.slice(0, 2));
    expect(vm.noMethodSelected()).toBe(true);
    expect(vm.paymentMethods().some(m => vm.isSelected(m))).toBe(false);
    expect(vm.canConfirm()).toBe(false);
    expect(vm.isCashBooking()).toBe(true);

    vm.selectMethod(vm.paymentMethods()[0]);
    expect(vm.noMethodSelected()).toBe(false);
    expect(vm.selectedMethod()).toBe('NEQUI');
  });

  it('las reservas DIGITAL o antiguas (sin modo) abren con el primer medio, como antes', () => {
    expect(vmFor('DIGITAL').selectedMethod()).toBe('NEQUI');
    TestBed.resetTestingModule();
    expect(vmFor(null).selectedMethod()).toBe('NEQUI');
  });

  it('las reservas en efectivo o antiguas (sin modo) siguen viendo el efectivo', () => {
    expect(vmFor('CASH').paymentMethods().map(m => m.id)).toEqual(['NEQUI', 'TRANSFER', 'CASH']);
    TestBed.resetTestingModule();
    expect(vmFor(null).paymentMethods().map(m => m.id)).toEqual(['NEQUI', 'TRANSFER', 'CASH']);
  });
});
