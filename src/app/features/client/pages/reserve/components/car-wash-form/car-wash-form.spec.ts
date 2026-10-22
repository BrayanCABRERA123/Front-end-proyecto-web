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

  it('opens the payment of the booking just created, not another active one', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => of(undefined) } as never);

    component.vm.selectedVehicleId.set(3);
    component.vm.selectedServiceId.set(5);
    component.vm.date.set('2026-10-30');
    component.vm.time.set('10:00');
    component.onSubmit();

    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/bookings')).flush({
      id: 42, code: 'R-0042', date: '2026-10-30', startTime: '10:00', endTime: '10:30',
      total: 35000, services: [{ name: 'Lavado básico' }], vehicle: null, bay: null,
    } as unknown as BookingResponse);

    expect(navigate).toHaveBeenCalledWith(['/client/payment'], { queryParams: { booking: 42 } });
  });
});
