import { TestBed } from '@angular/core/testing';

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
  // compila y pinta una tarjeta antes de cada prueba: el primer render (Material, traducciones) es
  // lento en este equipo y así queda en el hook, igual que en los demás specs de componentes
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HistoryCardComponent, BookingDetailModal] }).compileComponents();
    const warmUp = TestBed.createComponent(HistoryCardComponent);
    warmUp.componentInstance.booking = item();
    warmUp.detectChanges();
    await warmUp.whenStable();
  });

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

  it('una reserva en efectivo muestra la etiqueta en vez de "Pagar ahora" y deja cancelar', () => {
    const cash = TestBed.createComponent(HistoryCardComponent);
    cash.componentInstance.booking = item({ paymentMode: 'CASH' });
    cash.detectChanges();
    expect(cash.nativeElement.querySelector('[data-badge="pay-in-cash"]')).not.toBeNull();
    expect(cash.nativeElement.querySelector('.btn-pay')).toBeNull();
    expect(cash.nativeElement.querySelector('.btn-cancel')).not.toBeNull();

    const digital = TestBed.createComponent(HistoryCardComponent);
    digital.componentInstance.booking = item({ paymentMode: 'DIGITAL' });
    digital.detectChanges();
    expect(digital.nativeElement.querySelector('.btn-pay')).not.toBeNull();
    expect(digital.nativeElement.querySelector('[data-badge="pay-in-cash"]')).toBeNull();
  });

  it('en el detalle, la reserva en efectivo cambia "Ir al pago" por la etiqueta', () => {
    const fixture = TestBed.createComponent(BookingDetailModal);
    fixture.componentInstance.booking = item({ paymentMode: 'CASH' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-badge="pay-in-cash"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-go')).toBeNull();
  });

  it('el detalle de la reserva también la muestra', () => {
    const fixture = TestBed.createComponent(BookingDetailModal);
    fixture.componentInstance.booking = item({ payBefore: '14:30' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-badge="pay-before"]')).not.toBeNull();
  });
});
