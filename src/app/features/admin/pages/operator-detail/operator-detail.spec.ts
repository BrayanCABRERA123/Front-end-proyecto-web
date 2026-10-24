import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OperatorDetailComponent } from './operator-detail';
import { OperatorsStore } from '../../services/operators-store';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { Operator } from '../../models/admin.models';

const OSCAR = { id: '3', name: 'Oscar Ruiz', availability: [] } as unknown as Operator;
const ABSENCE = { startDate: '2026-10-22', endDate: '2026-10-23', reason: 'Incapacidad médica' };
const WEEK = [{ day: 0, startTime: '08:00', endTime: '17:00' }];
const REJECTED = new HttpErrorResponse({ status: 409, error: { code: 'ABSENCE_OVERLAPS' } });

describe('OperatorDetailComponent (admin)', () => {
  let component: OperatorDetailComponent;
  let feedback: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  const store = {
    getById: () => OSCAR,
    loaded: () => true,
    refresh: () => undefined,
    addAbsence: vi.fn(),
    setAvailability: vi.fn(),
  };

  // el modal "devuelve" lo que el admin llenó
  function modalReturns(result: unknown): void {
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(result) } as never);
  }

  beforeEach(() => {
    feedback = { success: vi.fn(), error: vi.fn() };
    store.addAbsence.mockReset();
    store.setAvailability.mockReset();
    TestBed.configureTestingModule({
      imports: [OperatorDetailComponent],
      providers: [
        { provide: OperatorsStore, useValue: store },
        { provide: FeedbackService, useValue: feedback },
      ],
    });
    component = TestBed.createComponent(OperatorDetailComponent).componentInstance;
  });

  it('confirma la incapacidad solo cuando el servidor la guardó', () => {
    store.addAbsence.mockReturnValue(of({ id: 1 }));
    modalReturns(ABSENCE);

    component.registerAbsence();

    expect(store.addAbsence).toHaveBeenCalledWith('3', ABSENCE);
    expect(feedback.success).toHaveBeenCalledWith('OPERATOR_DETAIL.FEEDBACK.ABSENCE_TITLE',
      'OPERATOR_DETAIL.FEEDBACK.ABSENCE_MESSAGE', { messageParams: { name: 'Oscar Ruiz' } });
    expect(feedback.error).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza la incapacidad muestra el error y no el éxito', () => {
    store.addAbsence.mockReturnValue(throwError(() => REJECTED));
    modalReturns(ABSENCE);

    component.registerAbsence();

    expect(feedback.success).not.toHaveBeenCalled();
    expect(feedback.error).toHaveBeenCalledWith('OPERATOR_DETAIL.FEEDBACK.ABSENCE_ERROR_TITLE', expect.any(String));
  });

  it('si no se puede guardar la disponibilidad muestra el error y no el éxito', () => {
    store.setAvailability.mockReturnValue(throwError(() => REJECTED));
    modalReturns(WEEK);

    component.editAvailability();

    expect(store.setAvailability).toHaveBeenCalledWith('3', WEEK);
    expect(feedback.success).not.toHaveBeenCalled();
    expect(feedback.error).toHaveBeenCalledWith('OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_ERROR_TITLE', expect.any(String));
  });

  it('cerrar el modal sin guardar no llama al servidor', () => {
    modalReturns(null);

    component.registerAbsence();
    component.editAvailability();

    expect(store.addAbsence).not.toHaveBeenCalled();
    expect(store.setAvailability).not.toHaveBeenCalled();
  });
});
