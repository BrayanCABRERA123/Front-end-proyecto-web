import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InspectionApiService } from '../../../core/services/inspection-api';
import { PublicReportViewModel } from './public-report.viewmodel';

describe('PublicReportViewModel', () => {
  const inspections = { published: vi.fn() };

  beforeEach(() => {
    inspections.published.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: InspectionApiService, useValue: inspections }, PublicReportViewModel],
    });
  });

  it('carga el reporte publicado del enlace', () => {
    inspections.published.mockReturnValue(of({ maskedPlate: 'ABC-***', phases: [] }));
    const vm = TestBed.inject(PublicReportViewModel);

    vm.load('tok-1');

    expect(inspections.published).toHaveBeenCalledWith('tok-1');
    expect(vm.loading()).toBe(false);
    expect(vm.report()?.maskedPlate).toBe('ABC-***');
  });

  it('un enlace sin publicar termina la carga sin reporte', () => {
    inspections.published.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { code: 'INSPECTION_NOT_PUBLISHED' } })));
    const vm = TestBed.inject(PublicReportViewModel);

    vm.load('tok-2');

    expect(vm.loading()).toBe(false);
    expect(vm.report()).toBeNull();
  });
});
