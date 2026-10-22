import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PaymentComponent } from './payment';
import { PaymentAccountResponse } from '../../../../core/services/payments-api';
import { BookingResponse } from '../../../../core/models/booking.models';
import { PaymentViewModel } from '../../viewmodels/payment.viewmodel';

// reserva mínima como la manda booking-service
const booking = (id: number, date: string, status = 'CONFIRMED') => ({
  id, code: `RES-${id}`, status, date, startTime: '09:00', endTime: '09:45',
  subtotal: 20000, pointsDiscountAmount: 0, services: [{ name: 'Básico' }], vehicle: null,
});

const nequi = (id: number, holder: string): PaymentAccountResponse => ({
  id, methodCode: 'NEQUI', methodName: 'Nequi', accountHolder: holder, accountNumber: '3001234567',
  qrImageUrl: null, instructions: null, active: true, requiresReceipt: true,
});

describe('Payment', () => {
  let component: PaymentComponent;
  let fixture: ComponentFixture<PaymentComponent>;
  let vm: PaymentViewModel;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    vm = component.vm;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  // deja el comprobante listo como si el cliente lo hubiera elegido y ya estuviera comprimido
  function withReceipt(): void {
    vm.receiptFile.set(new File(['x'], 'comprobante.png', { type: 'image/png' }));
    vm['receiptDataUrl'].set('data:image/png;base64,AAAA');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks only the chosen account when two accounts share the same method', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0]
      .flush([nequi(1, 'Lavadero Principal'), nequi(2, 'Lavadero Sede Norte')]);

    const [first, second] = vm.paymentMethods();
    expect(first.holder).toBe('Lavadero Principal');
    expect(second.holder).toBe('Lavadero Sede Norte');
    expect(vm.isSelected(first)).toBe(true);
    expect(vm.isSelected(second)).toBe(false);

    vm.selectMethod(second);

    expect(vm.isSelected(first)).toBe(false);
    expect(vm.isSelected(second)).toBe(true);
    expect(vm.selectedAccount()?.id).toBe(2);
  });

  it('does not offer cash nor let the customer confirm when every payment account is off', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([]);

    expect(vm.paymentMethods().length).toBe(0);
    expect(vm.noPaymentMethods()).toBe(true);
    expect(vm.canConfirm()).toBe(false);
    expect(vm.missingRequirements()).toEqual([]);
  });

  it('sends the payment only once when the button is pressed twice', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    vm.booking.set({ id: 9 } as BookingResponse);
    withReceipt();
    vm.transactionRef.set('ABC12345');
    vm.paidAmountInput.set(35000);
    expect(vm.canConfirm()).toBe(true);

    vm.confirmPayment();
    vm.confirmPayment();

    const reports = http.match(req => req.method === 'POST' && req.url.endsWith('/payments'));
    expect(reports.length).toBe(1);
    expect(vm.canConfirm()).toBe(false);
    // si el servidor rechaza, el botón vuelve a quedar disponible para corregir y reintentar
    reports[0].flush({ code: 'TRANSACTION_REFERENCE_REUSED' }, { status: 409, statusText: 'Conflict' });
    expect(vm.canConfirm()).toBe(true);
  });

  it('warns and blocks the payment when the payment accounts cannot be loaded', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0]
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(vm.accountsFailed()).toBe(true);
    expect(vm.noPaymentMethods()).toBe(true);
    expect(vm.canConfirm()).toBe(false);
  });

  // reservas de booking-service y cuáles deja pagar payment-service
  function flushBookings(bookings: object[], payableIds: number[]): void {
    http.match(req => req.url.endsWith('/bookings/me'))[0].flush(bookings);
    http.match(req => req.url.endsWith('/payments/me/bookings'))[0].flush(
      bookings.map(b => ({ bookingId: (b as { id: number }).id, paymentStatus: null, payable: payableIds.includes((b as { id: number }).id) }))
    );
  }

  it('opens the payable booking and asks for receipt, reference and amount before paying', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    flushBookings([booking(9, '2099-10-23')], [9]);

    expect(vm.reservationCode()).toBe('RES-9');
    expect(vm.totalToPay()).toBe(20000);
    expect(vm.missingRequirements()).toEqual(['PAYMENT.CONFIRM.MISSING.RECEIPT', 'PAYMENT.CONFIRM.MISSING.REFERENCE']);
  });

  it('from the menu opens the next payable booking, skipping the ones already paid or in review', () => {
    flushBookings([
      booking(1, '2020-09-30', 'IN_PROGRESS'), booking(2, '2099-01-01'), booking(3, '2099-01-05'), booking(4, '2099-01-03'),
    ], [1, 3, 4]);

    expect(vm.booking()?.id).toBe(4);
  });

  it('when every payable booking already passed, opens the most recent one', () => {
    flushBookings([booking(1, '2020-09-30', 'IN_PROGRESS'), booking(5, '2020-10-16'), booking(6, '2020-10-20')], [1, 5]);

    expect(vm.booking()?.id).toBe(5);
  });

  it('says there is nothing to pay when payment-service allows none of the bookings', () => {
    flushBookings([booking(2, '2099-01-01'), booking(7, '2020-10-01', 'CANCELLED')], []);

    expect(vm.booking()).toBeNull();
    expect(vm.notFound()).toBe(true);
  });

  it('shows "step 2 of 2" only when there is a booking to pay', async () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    flushBookings([], []);
    await fixture.whenStable();
    const html: HTMLElement = fixture.nativeElement;

    expect(html.querySelector('.step-pill')).toBeNull();

    vm.booking.set({ id: 9 } as BookingResponse);
    vm.reservationCode.set('RES-9');
    await fixture.whenStable();

    expect(html.querySelector('.step-pill')?.textContent).toContain('#RES-9');
  });
});
