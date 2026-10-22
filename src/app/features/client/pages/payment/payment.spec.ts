import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PaymentComponent } from './payment';
import { PaymentAccountResponse } from '../../../../core/services/payments-api';

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

  it('warns and blocks the payment when the payment accounts cannot be loaded', () => {
    http.match(req => req.url.endsWith('/payment-accounts'))[0]
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(component.accountsFailed).toBe(true);
    expect(component.noPaymentMethods).toBe(true);
    expect(component.canConfirm).toBe(false);
  });
});
