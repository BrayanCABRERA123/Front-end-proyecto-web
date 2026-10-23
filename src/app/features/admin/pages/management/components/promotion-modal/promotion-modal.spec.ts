import { MatDialogRef } from '@angular/material/dialog';

import { PromotionModal } from './promotion-modal';

describe('PromotionModal (descuento del cupón)', () => {
  function modal(): PromotionModal {
    const component = new PromotionModal({ close: () => undefined } as unknown as MatDialogRef<PromotionModal>, null);
    component.name = 'Verano';
    component.description = 'Cupón de verano';
    component.couponCode = 'VERANO';
    return component;
  }

  it('E-07: no acepta 100 % (la reserva quedaría sin poder pagarse)', () => {
    const component = modal();
    component.submitted = true;
    component.discountPercent = 100;

    expect(component.discountPercentInvalid).toBe(true);
    expect(component.canSave).toBe(false);
  });

  it('acepta hasta 99 % y no arranca en 100 %', () => {
    const component = modal();
    expect(component.discountPercent).not.toBe(100);

    component.submitted = true;
    component.discountPercent = 99;

    expect(component.discountPercentInvalid).toBe(false);
    expect(component.canSave).toBe(true);
  });
});
