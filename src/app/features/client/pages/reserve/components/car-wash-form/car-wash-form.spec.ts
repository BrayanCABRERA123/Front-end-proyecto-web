import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CarWashFormComponent } from './car-wash-form';
import { BookingResponse } from '../../../../../../core/models/booking.models';

describe('CarWashFormComponent', () => {
  let component: CarWashFormComponent;
  let fixture: ComponentFixture<CarWashFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarWashFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarWashFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // reserva como la devuelve booking-service al crearla
  const created = (paymentMode: 'DIGITAL' | 'CASH') => ({
    id: 42, code: 'R-0042', date: '2026-10-30', startTime: '10:00', endTime: '10:30',
    total: 35000, services: [{ name: 'Lavado básico' }], vehicle: null, bay: null,
    paymentMode, paymentDeadline: '2026-10-30T14:30:00Z', paymentReported: false,
  } as unknown as BookingResponse);

  function submitBooking(): HttpTestingController {
    const http = TestBed.inject(HttpTestingController);
    component.vm.selectedVehicleId.set(3);
    component.vm.selectedServiceId.set(5);
    component.vm.date.set('2026-10-30');
    component.vm.time.set('10:00');
    component.onSubmit();
    return http;
  }

  function flushAccounts(methodCodes: string[]): void {
    const http = TestBed.inject(HttpTestingController);
    http.match(req => req.url.endsWith('/payment-accounts'))
      .forEach(req => req.flush(methodCodes.map((methodCode, i) => ({ id: i + 1, methodCode, methodName: methodCode, accountHolder: 'Lavadero' }))));
    fixture.detectChanges();
  }

  it('with DIGITAL goes straight to the payment of the booking just created, not another active one', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');

    const http = submitBooking();
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/bookings'));
    expect(request.request.body.paymentMode).toBe('DIGITAL');
    request.flush(created('DIGITAL'));

    expect(open).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/client/payment'], { queryParams: { booking: 42 } });
  });

  it('with CASH shows the cash notice and "View my bookings" goes to the history', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => of(undefined) } as never);
    flushAccounts(['NEQUI', 'EFECTIVO']);
    component.vm.selectPaymentMode('CASH');

    const http = submitBooking();
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/bookings'));
    expect(request.request.body.paymentMode).toBe('CASH');
    request.flush(created('CASH'));

    expect(open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      data: expect.objectContaining({ message: 'RESERVE.SUCCESS_MESSAGE_CASH', buttonText: 'RESERVE.SUCCESS_BUTTON_CASH' }),
    }));
    expect(navigate).toHaveBeenCalledWith(['/client/history']);
    expect(navigate).not.toHaveBeenCalledWith(['/client/payment'], expect.anything());
  });

  it('shows the cash option only when the car wash has its cash account active', () => {
    const options = () => [...fixture.nativeElement.querySelectorAll('[data-mode]')]
      .map((el: Element) => el.getAttribute('data-mode'));

    flushAccounts(['NEQUI', 'DAVIPLATA']);
    expect(options()).toEqual(['DIGITAL']);

    component.vm.load();
    flushAccounts(['NEQUI', 'EFECTIVO']);
    expect(options()).toEqual(['DIGITAL', 'CASH']);
  });
});
