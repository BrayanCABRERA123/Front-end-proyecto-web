import { HttpErrorResponse } from '@angular/common/http';

import { FormControl, FormGroup } from '@angular/forms';

import { TRANSLATED_CODES, apiErrorCode, apiErrorKey, apiFieldErrors, applyFieldErrors } from './api-error';
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

describe('WEB-05: errores por campo de un 400', () => {
  const badRequest = (errors: unknown) => new HttpErrorResponse({ status: 400, error: { code: 'VALIDATION_ERROR', errors } });

  it('Java: campo → texto en inglés se muestra con un mensaje propio', () => {
    expect(apiFieldErrors(badRequest({ licensePlate: 'licensePlate is required', 'address.city': 'too long' })))
      .toEqual({ licensePlate: 'API_ERRORS.FIELD_INVALID', city: 'API_ERRORS.FIELD_INVALID' });
  });

  it('.NET: campo → lista; si el texto es un código conocido usa su traducción', () => {
    expect(apiFieldErrors(badRequest({ TransactionReference: ['INVALID_TRANSACTION_REFERENCE'] })))
      .toEqual({ transactionReference: 'API_ERRORS.INVALID_TRANSACTION_REFERENCE' });
  });

  it('sin mapa errors, o con otro estado, no marca nada', () => {
    expect(apiFieldErrors(new HttpErrorResponse({ status: 400, error: { code: 'VALIDATION_ERROR' } }))).toEqual({});
    expect(apiFieldErrors(new HttpErrorResponse({ status: 409, error: { errors: { email: 'x' } } }))).toEqual({});
  });

  it('marca el control que corresponde (con alias) y deja el resto igual', () => {
    const form = new FormGroup({ phoneNumber: new FormControl('300'), email: new FormControl('a@gmail.com') });

    const marked = applyFieldErrors(form, badRequest({ phone: 'must match', unknownField: 'x' }), { phone: 'phoneNumber' });

    expect(marked).toBe(true);
    expect(form.controls.phoneNumber.getError('server')).toBe('API_ERRORS.FIELD_INVALID');
    expect(form.controls.phoneNumber.touched).toBe(true);
    expect(form.controls.email.errors).toBeNull();
  });
});
