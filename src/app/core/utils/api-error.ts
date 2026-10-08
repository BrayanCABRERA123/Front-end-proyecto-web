import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblem } from '../models/auth.models';

// códigos de error que tienen traducción en API_ERRORS.* (assets/i18n).
// cualquier otro (un código nuevo del backend, un error del framework) cae en UNEXPECTED
// para que el usuario nunca vea una llave de traducción sin traducir.
const TRANSLATED_CODES = new Set([
  'INVALID_CREDENTIALS',
  'ACCOUNT_DISABLED',
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
  'CONFLICT',
  'NOTIFICATION_NOT_FOUND',
  // códigos del booking-service (reservas)
  'SLOT_UNAVAILABLE',
  'VEHICLE_ALREADY_BOOKED',
  'SERVICE_NOT_AVAILABLE_FOR_VEHICLE',
  'INVALID_DATE',
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
  'EXECUTION_NOT_STARTED',
  'SERVICE_NOT_COMPLETED',
  'ALREADY_RATED',
  'ABSENCE_OVERLAP',
  'OPERATOR_NOT_FOUND',
  'BOOKING_NOT_FOUND',
  'BOOKING_SERVICE_UNAVAILABLE',
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

  const code = (error.error as ApiProblem | null)?.code;
  return code && TRANSLATED_CODES.has(code) ? code : 'UNEXPECTED';
}
