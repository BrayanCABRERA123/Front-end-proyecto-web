import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { HomeComponent } from './home';
import { OperationsApiService } from '../../../../core/services/operations-api';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { Reservation } from '../../../../shared/dialogs/reservation-models/reservation.model';

const REJECTED = new HttpErrorResponse({ status: 409, error: { code: 'BOOKING_NOT_STARTABLE' } });

describe('HomeComponent (operario)', () => {
  let component: HomeComponent;
  let open: ReturnType<typeof vi.fn>;
  const feedback = { error: vi.fn() };
  const operations = { start: vi.fn(), finish: vi.fn(), myServices: vi.fn(), myRatings: vi.fn() };

  beforeEach(() => {
    feedback.error.mockReset();
    operations.start.mockReset().mockReturnValue(throwError(() => REJECTED));
    operations.finish.mockReset().mockReturnValue(throwError(() => REJECTED));
    operations.myServices.mockReset().mockReturnValue(of([]));
    operations.myRatings.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: OperationsApiService, useValue: operations },
        { provide: FeedbackService, useValue: feedback },
      ],
    });
    component = TestBed.createComponent(HomeComponent).componentInstance;
    // el operario confirma todo lo que se le pregunta
    open = vi.fn().mockReturnValue({ afterClosed: () => of(true) });
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockImplementation(open as never);
  });

  it('si el servidor no deja iniciar avisa el motivo, no muestra éxito y recarga', () => {
    component.startService({ id: 9, code: 'R-0009', status: 'pendiente' } as unknown as Reservation);

    expect(operations.start).toHaveBeenCalledWith(9);
    expect(feedback.error).toHaveBeenCalledWith('COMMON.ERROR', expect.any(String));
    expect(open).toHaveBeenCalledTimes(1); // solo la confirmación, no el modal de éxito
    expect(operations.myServices).toHaveBeenCalled();
  });

  it('si el servidor no deja finalizar avisa el motivo y no muestra éxito', () => {
    component.requestFinish({ id: 9, code: 'R-0009', status: 'en_progreso' } as unknown as Reservation);

    expect(operations.finish).toHaveBeenCalledWith(9);
    expect(feedback.error).toHaveBeenCalledWith('COMMON.ERROR', expect.any(String));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
