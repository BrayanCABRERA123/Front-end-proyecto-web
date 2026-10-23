import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from '../../../core/services/auth';
import { OperatorsStore } from './operators-store';

function operator(id: number, fullName: string) {
  return { id, userId: 100 + id, fullName, email: `op${id}@gmail.com`, phone: '3000000000', active: true,
    hiredOn: '2026-01-01', week: [], completedServices: 0, averageRating: null, ratingsCount: 0 };
}

describe('OperatorsStore (A-19)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { hasAnyRole: () => true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('el operario con un servicio en curso hoy queda "En servicio" y se cuentan todos', () => {
    const store = TestBed.inject(OperatorsStore);

    http.match(r => r.url === '/api/v1/admin/operators/summary').forEach(r => r.flush(null));
    const ids = [1, 2, 3, 4, 5, 6];
    http.expectOne('/api/v1/admin/operators').flush(ids.map(id => operator(id, `Operario ${id}`)));
    ids.forEach(id => http.expectOne(`/api/v1/admin/operators/${id}/absences`).flush([]));
    http.expectOne('/api/v1/admin/operators/profiles').flush([]);
    http.expectOne(r => r.url === '/api/v1/admin/assignments')
      .flush([{ bookingId: 9, operatorId: 6, operatorName: 'Operario 6', status: 'IN_PROGRESS' },
              { bookingId: 10, operatorId: 2, operatorName: 'Operario 2', status: 'PENDING' }]);

    expect(store.getById('6')?.status).toBe('in_service');
    expect(store.getById('2')?.status).toBe('available');
    // el sexto también cuenta (antes el panel solo miraba los 5 primeros)
    expect(store.countByStatus('in_service')).toBe(1);
    expect(store.countByStatus('available')).toBe(5);
  });
});
