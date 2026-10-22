import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PaymentComponent } from './payment';
import { PaymentAccountResponse } from '../../../../core/services/payments-api';
import { BookingResponse } from '../../../../core/models/booking.models';
import { PaymentViewModel } from '../../viewmodels/payment.viewmodel';

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

  it('opens the booking of the URL and asks for receipt, reference and amount before paying', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    http.match(req => req.url.endsWith('/bookings/me'))[0].flush([
      { id: 9, code: 'RES-9', status: 'CONFIRMED', date: '2026-10-23', startTime: '09:00', endTime: '09:45',
        subtotal: 20000, pointsDiscountAmount: 0, services: [{ name: 'Básico' }], vehicle: null },
    ]);

    expect(vm.reservationCode()).toBe('RES-9');
    expect(vm.totalToPay()).toBe(20000);
    expect(vm.missingRequirements()).toEqual(['PAYMENT.CONFIRM.MISSING.RECEIPT', 'PAYMENT.CONFIRM.MISSING.REFERENCE']);
  });

  it('shows "step 2 of 2" only when there is a booking to pay', async () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    http.match(req => req.url.endsWith('/bookings/me'))[0].flush([]);
    await fixture.whenStable();
    const html: HTMLElement = fixture.nativeElement;

    expect(html.querySelector('.step-pill')).toBeNull();

    vm.booking.set({ id: 9 } as BookingResponse);
    vm.reservationCode.set('RES-9');
    await fixture.whenStable();

    expect(html.querySelector('.step-pill')?.textContent).toContain('#RES-9');
  });
});
