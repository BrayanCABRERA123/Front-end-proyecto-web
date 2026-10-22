import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { VehiclesComponent } from './vehicles';

describe('VehiclesComponent (cliente)', () => {
  let component: VehiclesComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [VehiclesComponent] });
    const fixture = TestBed.createComponent(VehiclesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    component.ngOnInit();
  });

  it('cuenta solo los lavados terminados y muestra la fecha del más reciente', () => {
    http.expectOne(req => req.url.endsWith('/bookings/me')).flush([
      { id: 1, status: 'COMPLETED', date: '2026-09-30' },
      { id: 2, status: 'COMPLETED', date: '2026-10-14' },
      { id: 3, status: 'CANCELLED', date: '2026-10-20' },
      { id: 4, status: 'CONFIRMED', date: '2026-10-25' },
    ]);

    expect(component.totalWashes).toBe(2);
    expect(component.lastWashOverall).toBe('14/10/2026');
  });

  it('sin lavados terminados (o sin respuesta de booking) muestra 0 y "—"', () => {
    http.expectOne(req => req.url.endsWith('/bookings/me'))
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(component.totalWashes).toBe(0);
    expect(component.lastWashOverall).toBe('—');
  });
});
