import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorCode, apiErrorKey } from './api-error';
import { slotTakenByOthers } from '../services/booking-api';

const conflict = (body: object) => new HttpErrorResponse({ status: 409, error: body });

describe('apiErrorCode', () => {
  it('traduce el código estable del backend', () => {
    expect(apiErrorKey(conflict({ code: 'VEHICLE_ALREADY_BOOKED' }))).toBe('API_ERRORS.VEHICLE_ALREADY_BOOKED');
  });

  it('un código desconocido cae en UNEXPECTED y sin red es NETWORK_ERROR', () => {
    expect(apiErrorCode(conflict({ code: 'ALGO_NUEVO' }))).toBe('UNEXPECTED');
    expect(apiErrorCode(new HttpErrorResponse({ status: 0 }))).toBe('NETWORK_ERROR');
  });

  it('una hora fuera del horario no se muestra como "ya no está disponible"', () => {
    const outside = conflict({ code: 'SLOT_UNAVAILABLE', reason: 'OUTSIDE_HOURS', alternatives: ['08:00'] });
    expect(apiErrorCode(outside)).toBe('SLOT_OUTSIDE_HOURS');
    expect(slotTakenByOthers(outside)).toBe(false);
  });

  it('sin motivo o con bahías llenas sigue siendo SLOT_UNAVAILABLE', () => {
    const full = conflict({ code: 'SLOT_UNAVAILABLE', reason: 'NO_FREE_BAY', alternatives: [] });
    const older = conflict({ code: 'SLOT_UNAVAILABLE', alternatives: [] });
    expect(apiErrorCode(full)).toBe('SLOT_UNAVAILABLE');
    expect(apiErrorCode(older)).toBe('SLOT_UNAVAILABLE');
    expect(slotTakenByOthers(full)).toBe(true);
    expect(slotTakenByOthers(older)).toBe(true);
  });
});
