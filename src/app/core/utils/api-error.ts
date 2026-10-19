import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblem } from '../models/auth.models';

// códigos de error que tienen traducción en API_ERRORS.* (assets/i18n).
// cualquier otro (un código nuevo del backend, un error del framework) cae en UNEXPECTED
// para que el usuario nunca vea una llave de traducción sin traducir.
const TRANSLATED_CODES = new Set([
  'INVALID_CREDENTIALS',
  'ACCOUNT_DISABLED',
  'ACCOUNT_LOCKED',
  'EMAIL_ALREADY_REGISTERED',
  'DOCUMENT_ALREADY_REGISTERED',
  'WEAK_PASSWORD',
  'INVALID_RESET_CODE',
  'INCORRECT_CURRENT_PASSWORD',
  'SAME_PASSWORD',
  'INVALID_EMAIL',
  'INVALID_DOCUMENT',
  'INVALID_PHONE',
  'INVALID_NAME',
  'VALIDATION_ERROR',
  // códigos del customer-service (vehículos)
  'PLATE_ALREADY_REGISTERED',
  'CUSTOMER_NOT_PROVISIONED',
  'VEHICLE_NOT_FOUND',
  'INVALID_PLATE',
  'INVALID_VEHICLE_TYPE',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'USER_NOT_FOUND',
  'CANNOT_DISABLE_OWN_ACCOUNT',
  'ADMIN_CANNOT_BE_DISABLED',
  'CANNOT_CHANGE_OWN_ROLE',
  'CONFLICT',
  'NOTIFICATION_NOT_FOUND',
  // códigos del booking-service (reservas)
  'SLOT_UNAVAILABLE',
  'BAY_NEW_IN_MAINTENANCE',
  // motivo del 409 SLOT_UNAVAILABLE (campo reason del booking-service)
  'SLOT_CLOSED_DAY',
  'SLOT_OUTSIDE_HOURS',
  'SLOT_TIME_PASSED',
  'VEHICLE_ALREADY_BOOKED',
  'SERVICE_NOT_AVAILABLE_FOR_VEHICLE',
  'INVALID_DATE',
  'ABSENCE_IN_PAST',
  'CUSTOMER_SERVICE_UNAVAILABLE',
  'BOOKING_NOT_CHANGEABLE',
  // códigos del operations-service (operarios, asignación, ejecución y calificaciones)
  'OPERATOR_NOT_ON_SHIFT',
  'OPERATOR_INACTIVE',
  'OPERATOR_ABSENT',
  'OPERATOR_BUSY',
  'BOOKING_NOT_ASSIGNABLE',
  'BOOKING_STATE_CONFLICT',
  'EXECUTION_ALREADY_STARTED',
  'SERVICE_TOO_EARLY',
  'BOOKING_IN_PAST',
  'EXECUTION_NOT_STARTED',
  'SERVICE_NOT_COMPLETED',
  'ALREADY_RATED',
  'ABSENCE_OVERLAP',
  'OPERATOR_NOT_FOUND',
  'BOOKING_NOT_FOUND',
  'BOOKING_SERVICE_UNAVAILABLE',
  // datos del negocio (booking-service)
  'ESTABLISHMENT_REQUIRED_FIELD',
  'ESTABLISHMENT_INVALID_PHONE',
  'ESTABLISHMENT_INVALID_EMAIL',
  'ESTABLISHMENT_INVALID_FOUNDATION_DATE',
  'ESTABLISHMENT_NOT_FOUND',
  // reporte de inspección (operations-service)
  'INSPECTION_NOT_FOUND',
  'INSPECTION_NOT_EDITABLE',
  'INSPECTION_NOT_PUBLISHED',
  'INVALID_FINDING',
  'TOO_MANY_PHOTOS',
  'INVALID_PHOTO',
  'CONTENT_TOO_LARGE',
  'BOOKING_WITHOUT_CLIENT',
  // permiso que no está en el catálogo al editar un rol (security-service)
  'UNKNOWN_PERMISSION',
  // códigos del canje de cupones de fidelización (payment-service, ADR-015)
  'PROMOTION_NOT_FOUND',
  'PROMOTION_NOT_REDEEMABLE',
  'PROMOTION_ALREADY_REDEEMED',
  'NETWORK_ERROR'
]);

// convierte cualquier error HTTP en su llave de traducción API_ERRORS.<CODE>.
// el backend manda un "code" estable (ej. EMAIL_ALREADY_REGISTERED) en cada error.
export function apiErrorKey(error: unknown): string {
  return `API_ERRORS.${apiErrorCode(error)}`;
}

export function apiErrorCode(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'UNEXPECTED';
  }

  // status 0: el navegador no pudo llegar al servidor (apagado, sin red, CORS)
  if (error.status === 0) {
    return 'NETWORK_ERROR';
  }

  const problem = error.error as (ApiProblem & { reason?: string }) | null;
  const code = problem?.code;
  // "no hay bahía libre" solo cuando ese es el motivo: fuera del horario o día cerrado se dice tal cual
  if (code === 'SLOT_UNAVAILABLE' && problem?.reason && TRANSLATED_CODES.has(`SLOT_${problem.reason}`)) {
    return `SLOT_${problem.reason}`;
  }
  return code && TRANSLATED_CODES.has(code) ? code : 'UNEXPECTED';
}
