import { FormControl } from '@angular/forms';

import { allowedEmailValidator, isAllowedEmail } from './email';

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
