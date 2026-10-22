import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth';
import { UserAdminService } from '../../core/services/user-admin';
import { ChangePasswordViewModel } from './change-password.viewmodel';
import { CreateUserViewModel } from './create-user.viewmodel';

describe('ViewModels de los formularios de cuenta', () => {
  const auth = { changePassword: vi.fn() };
  const userAdmin = { createAccount: vi.fn() };

  beforeEach(() => {
    auth.changePassword.mockReset();
    userAdmin.createAccount.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserAdminService, useValue: userAdmin },
        ChangePasswordViewModel, CreateUserViewModel,
      ],
    });
  });

  it('Cambiar contraseña: no deja repetir la actual y guarda la nueva', () => {
    auth.changePassword.mockReturnValue(of(undefined));
    const vm = TestBed.inject(ChangePasswordViewModel);
    const changed = vi.fn();

    vm.form.setValue({ currentPassword: 'Clave123*', newPassword: 'Clave123*', confirmPassword: 'Clave123*' });
    vm.submit(changed);
    expect(vm.form.errors?.['samePassword']).toBe(true);
    expect(auth.changePassword).not.toHaveBeenCalled();

    vm.form.setValue({ currentPassword: 'Clave123*', newPassword: 'Nueva456#', confirmPassword: 'Nueva456#' });
    vm.submit(changed);

    expect(auth.changePassword).toHaveBeenCalledWith('Clave123*', 'Nueva456#');
    expect(changed).toHaveBeenCalled();
  });

  it('Cambiar contraseña: si la actual es incorrecta queda el error en el modal', () => {
    auth.changePassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { code: 'INCORRECT_CURRENT_PASSWORD' } })));
    const vm = TestBed.inject(ChangePasswordViewModel);
    const changed = vi.fn();
    vm.form.setValue({ currentPassword: 'mala', newPassword: 'Nueva456#', confirmPassword: 'Nueva456#' });

    vm.submit(changed);

    expect(changed).not.toHaveBeenCalled();
    expect(vm.saving()).toBe(false);
    expect(vm.errorKey()).toBe('API_ERRORS.INCORRECT_CURRENT_PASSWORD');
  });

  it('Crear usuario: marca los errores solo después de intentar y crea con el rol elegido', () => {
    const created = { id: 9, firstName: 'Oscar', lastName: 'Ruiz' };
    userAdmin.createAccount.mockReturnValue(of(created));
    const vm = TestBed.inject(CreateUserViewModel);
    const done = vi.fn();

    expect(vm.firstNameInvalid()).toBe(false);
    vm.create(done);
    expect(vm.firstNameInvalid()).toBe(true);
    expect(userAdmin.createAccount).not.toHaveBeenCalled();

    vm.documentNumber.set('1.023.456.789');
    vm.sanitizeDocument();
    vm.firstName.set(' Oscar ');
    vm.lastName.set('Ruiz');
    vm.email.set('oscar.ruiz@gmail.com');
    vm.password.set('Temporal1!');
    vm.role.set('CLIENT');
    vm.create(done);

    expect(userAdmin.createAccount).toHaveBeenCalledWith({
      documentNumber: '1023456789', firstName: 'Oscar', lastName: 'Ruiz', email: 'oscar.ruiz@gmail.com',
      phone: null, password: 'Temporal1!', roles: ['CLIENT'],
    });
    expect(done).toHaveBeenCalledWith(created);
  });
});
