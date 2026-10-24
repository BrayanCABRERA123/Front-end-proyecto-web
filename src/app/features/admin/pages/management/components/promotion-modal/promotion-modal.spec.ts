import { MatDialogRef } from '@angular/material/dialog';

import { PromotionModal } from './promotion-modal';
import { discountLabel } from '../../../../../../core/services/promotions-api';

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
    component.discountValue = 100;

    expect(component.discountValueInvalid).toBe(true);
    expect(component.canSave).toBe(false);
  });

  it('acepta hasta 99 % y no arranca en 100 %', () => {
    const component = modal();
    expect(component.discountValue).not.toBe(100);

    component.submitted = true;
    component.discountValue = 99;

    expect(component.discountValueInvalid).toBe(false);
    expect(component.canSave).toBe(true);
  });

  it('D-01: al editar un descuento fijo lo deja en pesos (no lo convierte a porcentaje)', () => {
    const fixed = { name: 'Bono', description: 'Bono de 5 mil', couponCode: 'BONO5', featured: false, icon: 'star',
      features: [], startDate: '2026-10-01', discountPercent: 0, discountType: 'FIXED', discountValue: 5000, requiredPoints: 0 };
    let result: unknown = null;
    const component = new PromotionModal({ close: (r: unknown) => { result = r; } } as unknown as MatDialogRef<PromotionModal>,
      { promotion: fixed } as never);

    expect(component.isFixed).toBe(true);
    expect(component.discountValue).toBe(5000);
    component.save();

    expect(result).toEqual(expect.objectContaining({ discountType: 'FIXED', discountValue: 5000 }));
  });

  it('D-01: la etiqueta muestra el fijo como monto y el porcentaje con %', () => {
    expect(discountLabel({ discountType: 'FIXED', discountValue: 5000, discountPercent: 0 })).toBe('$5.000');
    expect(discountLabel({ discountType: 'PERCENT', discountValue: 10, discountPercent: 10 })).toBe('10%');
    // respuesta vieja sin tipo
    expect(discountLabel({ discountPercent: 15 })).toBe('15%');
  });
});
