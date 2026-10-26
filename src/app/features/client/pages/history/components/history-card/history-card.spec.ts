import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { HistoryCardComponent } from './history-card';
import { BookingDetailModal } from '../booking-detail-modal/booking-detail-modal';
import { ClientBookingItem } from '../../../../../../core/models/booking-view.models';

// reserva del historial ya mapeada, como la arma toClientBookingItem
const item = (changes: Partial<ClientBookingItem> = {}): ClientBookingItem => ({
  id: 1, code: 'RES-1', status: 'CONFIRMED', date: '2099-10-23', displayDate: '23/10/2099', timeRange: '09:00 - 09:45',
  services: ['Básico'], vehicle: 'Mazda 3', plate: 'ABC-123', total: 20000, paymentStatus: null,
  canPay: true, canCancel: true, canRate: false, ...changes,
});

describe('Insignia "Paga antes de las HH:mm"', () => {
  it('la tarjeta del historial la muestra solo cuando hay plazo pendiente', () => {
    const fixture = TestBed.createComponent(HistoryCardComponent);
    fixture.componentInstance.booking = item({ payBefore: '14:30' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-badge="pay-before"]')).not.toBeNull();

    const without = TestBed.createComponent(HistoryCardComponent);
    without.componentInstance.booking = item({ payBefore: null });
    without.detectChanges();
    expect(without.nativeElement.querySelector('[data-badge="pay-before"]')).toBeNull();
  });

  it('el detalle de la reserva también la muestra', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: item({ payBefore: '14:30' }) });
    const fixture = TestBed.createComponent(BookingDetailModal);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-badge="pay-before"]')).not.toBeNull();
  });
});
