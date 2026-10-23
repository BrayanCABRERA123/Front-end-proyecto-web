import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth';
import { UserSession } from '../../core/services/user-session';
import { PasswordAction, ProfileViewModel } from './profile.viewmodel';

const backendUser = { id: 1, firstName: 'Ana', lastName: 'Ruiz', email: 'ana@gmail.com', phone: '+573001234567', roles: ['CLIENT'] };

describe('ProfileViewModel', () => {
  const auth = {
    user: signal<typeof backendUser | null>(backendUser),
    getProfile: vi.fn(), getAddress: vi.fn(), updateProfile: vi.fn(), updateAddress: vi.fn(),
    changeEmail: vi.fn(), deactivateAccount: vi.fn(),
  };
  const session = {
    user: signal({ name: 'Ana Ruiz', email: 'ana@gmail.com', phone: '+57 3001234567', address: '', memberSince: '' }),
    initials: signal('AR'),
    update: vi.fn(),
  };

  beforeEach(() => {
    [auth.getProfile, auth.getAddress, auth.updateProfile, auth.updateAddress, auth.changeEmail, session.update].forEach(f => f.mockReset());
    auth.user.set(backendUser);
    auth.getProfile.mockReturnValue(of(backendUser));
    auth.getAddress.mockReturnValue(of('Calle 10 # 5-20'));
    auth.updateProfile.mockReturnValue(of(undefined));
    auth.updateAddress.mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: UserSession, useValue: session },
        ProfileViewModel,
      ],
    });
  });

  it('carga lo guardado en el backend con el formulario bloqueado', () => {
    const vm = TestBed.inject(ProfileViewModel);
    vm.load();

    expect(vm.form.disabled).toBe(true);
    expect(vm.form.getRawValue()).toMatchObject({ firstName: 'Ana', lastName: 'Ruiz', phoneCountry: 'CO', phoneNumber: '3001234567', address: 'Calle 10 # 5-20' });
    expect(vm.displayInitials()).toBe('AR');
    expect(vm.roleLabelKey()).toBe('PROFILE.ROLE.CLIENT');
    expect(vm.canCloseAccount()).toBe(true);
  });

  it('guarda sin pedir contraseña si el correo no cambió y actualiza la sesión', () => {
    const vm = TestBed.inject(ProfileViewModel);
    vm.load();
    vm.startEditing();
    vm.form.patchValue({ phoneNumber: '3109876543' });
    const confirmPassword = vi.fn();
    const saved = vi.fn();

    vm.save(confirmPassword, saved);

    expect(confirmPassword).not.toHaveBeenCalled();
    expect(auth.updateProfile).toHaveBeenCalledWith({ firstName: 'Ana', lastName: 'Ruiz', phone: '+573109876543' });
    expect(auth.updateAddress).toHaveBeenCalledWith('Calle 10 # 5-20');
    expect(session.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Ruiz', phone: '+57 3109876543' }));
    expect(saved).toHaveBeenCalled();
    expect(vm.editing()).toBe(false);
  });

  it('si cambió el correo, lo confirma con la contraseña antes de guardar', () => {
    auth.changeEmail.mockReturnValue(of(undefined));
    const vm = TestBed.inject(ProfileViewModel);
    vm.load();
    vm.startEditing();
    vm.form.patchValue({ email: 'ana.nueva@gmail.com' });
    const saved = vi.fn();

    // el "modal" corre la acción con la contraseña y avisa que salió bien
    vm.save(action => {
      (action as PasswordAction)('Clave123*').subscribe();
      return of(true);
    }, saved);

    expect(auth.changeEmail).toHaveBeenCalledWith('ana.nueva@gmail.com', 'Clave123*');
    expect(auth.updateProfile).toHaveBeenCalled();
    expect(saved).toHaveBeenCalled();
  });

  it('A-01: el correo nuevo debe ser de un dominio permitido (gmail.com)', () => {
    const vm = TestBed.inject(ProfileViewModel);
    vm.load();
    vm.startEditing();
    vm.form.patchValue({ email: 'ana@hotmail.com' });

    expect(vm.form.get('email')?.hasError('allowedEmail')).toBe(true);
    vm.save(() => of(true), vi.fn());
    expect(auth.changeEmail).not.toHaveBeenCalled();
  });

  it('un error del backend deja el formulario en edición con el mensaje', () => {
    auth.updateProfile.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { code: 'INVALID_PHONE' } })));
    const vm = TestBed.inject(ProfileViewModel);
    vm.load();
    vm.startEditing();
    const saved = vi.fn();

    vm.save(vi.fn(), saved);

    expect(saved).not.toHaveBeenCalled();
    expect(vm.editing()).toBe(true);
    expect(vm.saving()).toBe(false);
    expect(vm.errorKey()).toBe('API_ERRORS.INVALID_PHONE');
  });
});
