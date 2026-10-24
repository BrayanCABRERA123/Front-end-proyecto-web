import { HttpErrorResponse } from '@angular/common/http';

import { TRANSLATED_CODES, apiErrorCode, apiErrorKey } from './api-error';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import fr from '../../../assets/i18n/fr.json';
import pt from '../../../assets/i18n/pt.json';
import { slotTakenByOthers } from '../services/booking-api';

const conflict = (body: object) => new HttpErrorResponse({ status: 409, error: body });

describe('apiErrorCode', () => {
  it('traduce el código estable del backend', () => {
    expect(apiErrorKey(conflict({ code: 'VEHICLE_ALREADY_BOOKED' }))).toBe('API_ERRORS.VEHICLE_ALREADY_BOOKED');
  });

  it('A-13: la cuenta desactivada del operario tiene su propio mensaje', () => {
    expect(apiErrorKey(conflict({ code: 'OPERATOR_ACCOUNT_DISABLED' }))).toBe('API_ERRORS.OPERATOR_ACCOUNT_DISABLED');
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

describe('WEB-05: traducción de todos los códigos', () => {
  const languages = { es, en, fr, pt } as Record<string, { API_ERRORS: Record<string, string> }>;

  it('cada código que se traduce tiene texto en los 4 idiomas', () => {
    for (const [lang, file] of Object.entries(languages)) {
      const missing = [...TRANSLATED_CODES].filter(code => !file.API_ERRORS[code]);
      expect({ lang, missing }).toEqual({ lang, missing: [] });
    }
  });

  it('traduce los códigos nuevos del contrato y los de Merari (no caen en "error inesperado")', () => {
    const codes = ['AMOUNT_CHANGED', 'BOOKING_SERVICES_LOCKED', 'INVALID_PRICE', 'VEHICLE_HAS_ACTIVE_BOOKINGS',
      'SCHEDULE_CONFLICTS_BOOKINGS', 'RATE_LIMITED', 'CONSENT_REQUIRED', 'TOO_MANY_ATTEMPTS',
      'PROMOTION_ONE_PER_BOOKING', 'PROMOTION_REDEMPTION_NOT_FOUND', 'INVALID_PROMOTION_DISCOUNT',
      'EMAIL_DOMAIN_NOT_ALLOWED', 'OPERATOR_ACCOUNT_DISABLED'];
    for (const code of codes) {
      expect(apiErrorCode(conflict({ code }))).toBe(code);
    }
  });

  it('traduce los de payment-service, booking y operations que antes salían como inesperados', () => {
    for (const code of ['TRANSACTION_REFERENCE_REUSED', 'PAYMENT_ALREADY_REPORTED', 'BAY_HAS_BOOKINGS', 'ASSIGNMENT_BUSY',
      'INVALID_RATING', 'RECEIPT_TOO_LARGE', 'SERVICE_UNAVAILABLE']) {
      expect(apiErrorCode(conflict({ code }))).toBe(code);
    }
  });
});
