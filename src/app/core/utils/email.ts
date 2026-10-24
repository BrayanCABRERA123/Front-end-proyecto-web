import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// A-01: los mismos dominios que ALLOWED_EMAIL_DOMAINS de security-service (por defecto gmail.com).
// La pantalla avisa antes de enviar; quien decide es el servidor (EMAIL_DOMAIN_NOT_ALLOWED)
export const ALLOWED_EMAIL_DOMAINS = ['gmail.com'];

const EMAIL_FORMAT = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/** solo el formato (usuario@dominio.tld), sin mirar el dominio: lo usan el login y la recuperación */
export function isEmailFormat(value: string): boolean {
  return EMAIL_FORMAT.test(value.trim().toLowerCase());
}

/** formato válido y dominio permitido (comparación exacta: gmail.com.co no es gmail.com) */
export function isAllowedEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  return EMAIL_FORMAT.test(email) && ALLOWED_EMAIL_DOMAINS.includes(email.slice(email.indexOf('@') + 1));
}

/**
 * A-01 (decisión del 23-10): login y recuperar contraseña validan solo el formato, porque el servidor
 * no restringe el login y las cuentas que ya existen con otros dominios tienen que poder entrar.
 * { emailFormat: true } si el formato no es válido; vacío no marca error (para eso está required).
 */
export function emailFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    return !value || isEmailFormat(value) ? null : { emailFormat: true };
  };
}

/**
 * Validador de formularios reactivos: { allowedEmail: true } si el correo no es de un dominio permitido.
 * Vacío no marca error (para eso está required). keep: el correo que ya tiene la cuenta, que se
 * acepta aunque sea de otro dominio (cuentas antiguas que editan su perfil sin cambiarlo).
 */
export function allowedEmailValidator(keep?: () => string | null | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    // el correo actual se compara igual que lo hace security-service: sin espacios ni mayúsculas
    const current = keep?.()?.trim();
    if (current && value.toLowerCase() === current.toLowerCase()) return null;
    return isAllowedEmail(value) ? null : { allowedEmail: true };
  };
}
