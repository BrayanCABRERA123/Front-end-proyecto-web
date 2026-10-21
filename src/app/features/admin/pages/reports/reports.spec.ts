import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ReportsComponent } from './reports';
import { ReservationsStore } from '../../services/reservations-store';
import { PaymentsStore } from '../../services/payments-store';
import { Booking } from '../../models/admin.models';
import { isoDaysFromToday } from '../../../../core/utils/dates';

const TODAY = isoDaysFromToday(0);

function booking(id: number, date: string, status: Booking['status']): Booking {
  return {
    id: String(id), code: `RES-${id}`, clientUserId: 7, client: 'Ana Ruiz', phone: '', email: '', vehicle: 'Mazda 3',
    plate: 'ABC-123', service: 'Premium', serviceIds: [1], vehicleId: 5, date, time: '10:00', durationMin: 60,
    bay: 'Bahía 1', status, changeable: false, cancellationReason: null, operator: null, notes: '', createdAt: '', amount: 40000,
  };
}

describe('ReportsComponent (admin)', () => {
  let component: ReportsComponent;

  beforeEach(() => {
    const bookings = signal<Booking[]>([
      booking(1, TODAY, 'completed'),
      booking(2, isoDaysFromToday(-3), 'completed'),
      booking(3, isoDaysFromToday(-3), 'no_show'),
      booking(4, isoDaysFromToday(-2), 'cancelled'),
      booking(5, isoDaysFromToday(2), 'confirmed'),
      booking(6, isoDaysFromToday(-20), 'completed'),
    ]);
    TestBed.configureTestingModule({
      imports: [ReportsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ReservationsStore, useValue: { bookings, today: TODAY,
          byDate: (date: string) => bookings().filter(b => b.date === date) } },
        { provide: PaymentsStore, useValue: { payments: signal([]), today: TODAY } },
      ],
    });
    // sin detectChanges: la gráfica (canvas) no se pinta, solo se prueban los conteos
    component = TestBed.createComponent(ReportsComponent).componentInstance;
  });

  it('cuenta como realizados solo los servicios completados hasta hoy', () => {
    expect(component.dayReport.services).toBe(1);
    // la futura, la cancelada y la de "no asistió" no son servicios hechos
    expect(component.weekReport.services).toBe(2);
    expect(component.monthReport.services).toBe(3);
  });

  it('la gráfica de la semana suma lo mismo que la tarjeta de la semana', () => {
    const week = component.chartData;
    expect(week.services.reduce((a, b) => a + b, 0)).toBe(component.weekReport.services);
    expect(week.isEmpty).toBe(false);
  });
});
