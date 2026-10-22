import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PaymentComponent } from './payment';
import { PaymentAccountResponse } from '../../../../core/services/payments-api';
import { BookingResponse } from '../../../../core/models/booking.models';

const nequi = (id: number, holder: string): PaymentAccountResponse => ({
  id, methodCode: 'NEQUI', methodName: 'Nequi', accountHolder: holder, accountNumber: '3001234567',
  qrImageUrl: null, instructions: null, active: true, requiresReceipt: true,
});

describe('Payment', () => {
  let component: PaymentComponent;
  let fixture: ComponentFixture<PaymentComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks only the chosen account when two accounts share the same method', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0]
      .flush([nequi(1, 'Lavadero Principal'), nequi(2, 'Lavadero Sede Norte')]);

    const [first, second] = component.paymentMethods;
    expect(first.holder).toBe('Lavadero Principal');
    expect(second.holder).toBe('Lavadero Sede Norte');
    expect(component.isSelected(first)).toBe(true);
    expect(component.isSelected(second)).toBe(false);

    component.selectMethod(second);

    expect(component.isSelected(first)).toBe(false);
    expect(component.isSelected(second)).toBe(true);
    expect(component.selectedAccount?.id).toBe(2);
  });

  it('does not offer cash nor let the customer confirm when every payment account is off', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([]);

    expect(component.paymentMethods.length).toBe(0);
    expect(component.noPaymentMethods).toBe(true);
    expect(component.canConfirm).toBe(false);
    expect(component.missingRequirements).toEqual([]);
  });

  it('sends the payment only once when the button is pressed twice', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0].flush([nequi(1, 'Lavadero Principal')]);
    component.booking = { id: 9 } as BookingResponse;
    component['receiptDataUrl'] = 'data:image/png;base64,AAAA';
    component.receiptFile = new File(['x'], 'comprobante.png', { type: 'image/png' });
    component.transactionRef = 'ABC12345';
    component.paidAmountInput = 35000;
    expect(component.canConfirm).toBe(true);

    component.confirmPayment();
    component.confirmPayment();

    const reports = http.match(req => req.method === 'POST' && req.url.endsWith('/payments'));
    expect(reports.length).toBe(1);
    expect(component.canConfirm).toBe(false);
    // si el servidor rechaza, el botón vuelve a quedar disponible para corregir y reintentar
    reports[0].flush({ code: 'TRANSACTION_REFERENCE_REUSED' }, { status: 409, statusText: 'Conflict' });
    expect(component.canConfirm).toBe(true);
  });

  it('warns and blocks the payment when the payment accounts cannot be loaded', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0]
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(component.accountsFailed).toBe(true);
    expect(component.noPaymentMethods).toBe(true);
    expect(component.canConfirm).toBe(false);
  });
});
