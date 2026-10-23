import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { LoginViewModel } from './login.viewmodel';
import { ForgotPasswordViewModel } from './forgot-password.viewmodel';
import { RegisterViewModel } from './register.viewmodel';

const user = { id: 1, firstName: 'Ana', lastName: 'Ruiz', roles: ['CLIENT'] };

describe('ViewModels de autenticación', () => {
  const auth = {
    login: vi.fn(), homeRoute: vi.fn(), requestPasswordReset: vi.fn(), verifyResetCode: vi.fn(), resetPassword: vi.fn(),
    register: vi.fn(),
  };
  const feedback = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

  beforeEach(() => {
    [auth, feedback].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    auth.homeRoute.mockReturnValue('/client');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: FeedbackService, useValue: feedback },
        LoginViewModel, ForgotPasswordViewModel, RegisterViewModel,
      ],
    });
  });

  it('Login: entrega el usuario a la vista y vuelve a la página pedida solo si es de su área', () => {
    auth.login.mockReturnValue(of(user));
    const vm = TestBed.inject(LoginViewModel);
    vm.form.setValue({ email: 'ana@gmail.com', password: 'Clave123*' });
    const loggedIn = vi.fn();

    vm.submit(loggedIn);

    expect(auth.login).toHaveBeenCalledWith('ana@gmail.com', 'Clave123*');
    expect(loggedIn).toHaveBeenCalledWith(user);
    expect(vm.homeTarget(user as never, '/client/history')).toBe('/client/history');
    expect(vm.homeTarget(user as never, '/admin/reports')).toBe('/client');
  });

  it('Login: la cuenta bloqueada se avisa con su propio título y no navega', () => {
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 423, error: { code: 'ACCOUNT_LOCKED' } })));
    const vm = TestBed.inject(LoginViewModel);
    vm.form.setValue({ email: 'ana@gmail.com', password: 'mala' });
    const loggedIn = vi.fn();

    vm.submit(loggedIn);

    expect(loggedIn).not.toHaveBeenCalled();
    expect(vm.loading()).toBe(false);
    expect(vm.errorKey()).toBe('API_ERRORS.ACCOUNT_LOCKED');
    expect(feedback.error.mock.calls[0][0]).toBe('AUTH_FEEDBACK.LOCKED_TITLE');
  });

  it('Recuperar contraseña: correo → código → contraseña nueva con el código confirmado', () => {
    auth.requestPasswordReset.mockReturnValue(of(undefined));
    auth.verifyResetCode.mockReturnValue(of(undefined));
    auth.resetPassword.mockReturnValue(of(undefined));
    const vm = TestBed.inject(ForgotPasswordViewModel);
    const updated = vi.fn();

    vm.email.set(' ana@gmail.com ');
    vm.stripEmailSpaces();
    vm.requestCode();
    expect(vm.step()).toBe(2);

    // el código tiene 6 dígitos
    vm.verify('12345');
    expect(auth.verifyResetCode).not.toHaveBeenCalled();
    vm.verify('123456');
    expect(vm.step()).toBe(3);

    // las contraseñas no coinciden
    vm.newPassword.set('Nueva123*');
    vm.confirmPassword.set('Nueva123');
    vm.resetPassword(updated);
    expect(auth.resetPassword).not.toHaveBeenCalled();
    vm.confirmPassword.set('Nueva123*');
    vm.resetPassword(updated);

    expect(auth.resetPassword).toHaveBeenCalledWith('ana@gmail.com', '123456', 'Nueva123*');
    expect(updated).toHaveBeenCalled();
  });

  it('Recuperar contraseña: un código errado deja al usuario en el paso 2 con el error', () => {
    auth.verifyResetCode.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { code: 'INVALID_RESET_CODE' } })));
    const vm = TestBed.inject(ForgotPasswordViewModel);
    vm.step.set(2);

    vm.verify('000000');

    expect(vm.step()).toBe(2);
    expect(vm.verifying()).toBe(false);
    expect(vm.errorKey()).toBe('API_ERRORS.INVALID_RESET_CODE');
  });

  it('F-02 Registro: limpia cédula y celular, exige que las contraseñas coincidan y envía los consentimientos', () => {
    auth.register.mockReturnValue(of({}));
    const vm = TestBed.inject(RegisterViewModel);
    const registered = vi.fn();
    vm.form.patchValue({ documentNumber: '1.023.456.789', firstName: ' Ana ', lastName: 'Ruiz', email: 'ana@gmail.com',
      phone: '300-123-4567', password: 'Lavado2026!', confirmPassword: 'Otra2026!' });
    vm.sanitizeDocument();
    vm.sanitizePhone();
    expect(vm.f.documentNumber.value).toBe('1023456789');
    expect(vm.f.phone.value).toBe('3001234567');

    vm.submit(registered);
    expect(vm.f.confirmPassword.hasError('notMatch')).toBe(true);
    expect(auth.register).not.toHaveBeenCalled();

    vm.form.patchValue({ confirmPassword: 'Lavado2026!' });
    vm.acceptDocument('terms');
    vm.acceptDocument('privacy');
    vm.submit(registered);

    expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({
      documentNumber: '1023456789', firstName: 'Ana', acceptsTerms: true, acceptsDataPolicy: true }));
    expect(registered).toHaveBeenCalled();
  });

  it('F-02 Registro: un error del servidor queda en errorKey y no avisa éxito', () => {
    auth.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'EMAIL_ALREADY_REGISTERED' } })));
    const vm = TestBed.inject(RegisterViewModel);
    const registered = vi.fn();
    vm.form.patchValue({ documentNumber: '1023456789', firstName: 'Ana', lastName: 'Ruiz', email: 'ana@gmail.com',
      phone: '3001234567', password: 'Lavado2026!', confirmPassword: 'Lavado2026!', acceptTerms: true, acceptDataPolicy: true });

    vm.submit(registered);

    expect(vm.errorKey()).toBe('API_ERRORS.EMAIL_ALREADY_REGISTERED');
    expect(vm.loading()).toBe(false);
    expect(registered).not.toHaveBeenCalled();
  });
});
