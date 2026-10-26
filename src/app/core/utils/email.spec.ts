import { FormControl } from '@angular/forms';

import { allowedEmailValidator, emailFormatValidator, isAllowedEmail, isEmailFormat } from './email';

describe('correos permitidos (A-01)', () => {
  it('solo acepta los dominios de ALLOWED_EMAIL_DOMAINS (gmail.com), sin importar mayúsculas', () => {
    expect(isAllowedEmail(' Ana.Perez@Gmail.com ')).toBe(true);
    expect(isAllowedEmail('ana@hotmail.com')).toBe(false);
    expect(isAllowedEmail('ana@gmail.com.co')).toBe(false);
    expect(isAllowedEmail('ana@mail.gmail.com')).toBe(false);
    expect(isAllowedEmail('ana@')).toBe(false);
  });

  it('el validador deja vacío al required y respeta el correo que ya tenía la cuenta', () => {
    expect(allowedEmailValidator()(new FormControl(''))).toBeNull();
    expect(allowedEmailValidator()(new FormControl('ana@outlook.com'))).toEqual({ allowedEmail: true });
    // una cuenta antigua con otro dominio puede seguir editando su perfil sin cambiar el correo
    const keep = allowedEmailValidator(() => 'ana@outlook.com');
    expect(keep(new FormControl('Ana@Outlook.com'))).toBeNull();
    expect(keep(new FormControl('ana@yahoo.com'))).toEqual({ allowedEmail: true });
  });
});

describe('login y recuperación: solo formato (A-01, decisión del 23-10)', () => {
  it('acepta cualquier dominio con formato válido y rechaza lo que no es un correo', () => {
    expect(isEmailFormat(' Ana@Outlook.com ')).toBe(true);
    expect(isEmailFormat('ana@gmail.com')).toBe(true);
    expect(isEmailFormat('ana@')).toBe(false);
    expect(isEmailFormat('ana.gmail.com')).toBe(false);
  });

  it('el validador del login no marca otros dominios, solo el formato', () => {
    expect(emailFormatValidator()(new FormControl(''))).toBeNull();
    expect(emailFormatValidator()(new FormControl('ana@hotmail.com'))).toBeNull();
    expect(emailFormatValidator()(new FormControl('ana@hotmail'))).toEqual({ emailFormat: true });
  });

  it('en el perfil el correo actual se acepta aunque tenga espacios o mayúsculas distintas', () => {
    const keep = allowedEmailValidator(() => ' Ana@Outlook.com ');
    expect(keep(new FormControl('ana@outlook.com '))).toBeNull();
  });
});
