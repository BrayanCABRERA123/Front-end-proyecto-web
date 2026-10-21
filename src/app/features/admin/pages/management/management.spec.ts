import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ManagementComponent } from './management';

const ADMIN_SESSION = JSON.stringify({
  accessToken: 'token',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  user: { id: 1, email: 'admin@gmail.com', documentNumber: '1', firstName: 'Ana', lastName: 'Ruiz', phone: null,
    roles: ['ADMIN'], active: true, lastLogin: null },
});

function account(id: number, firstName: string, role: string, active = true) {
  return { id, email: `${firstName.toLowerCase()}@demo.com`, documentNumber: String(id), firstName, lastName: 'Demo',
    phone: null, roles: [role], active, lastLogin: null, createdAt: '2026-10-01T10:00:00Z' };
}

describe('ManagementComponent (admin)', () => {
  let http: HttpTestingController;
  let component: ManagementComponent;

  /** responde la carga inicial de la pantalla (cuentas, roles, servicios y promociones) */
  function flushLoad(): void {
    http.match(r => r.url === '/api/v1/admin/users').forEach(r => r.flush({
      items: [account(1, 'Ana', 'ADMIN'), account(2, 'Oscar', 'OPERATOR'), account(3, 'Lucia', 'CLIENT'),
        account(4, 'Pedro', 'CLIENT', false)], page: 0, size: 100, totalItems: 4, totalPages: 1 }));
    http.match(r => r.url === '/api/v1/admin/roles-permissions').forEach(r => r.flush({
      permissions: [{ id: 1, code: 'VIEW_DASHBOARD', name: 'Ver paneles' }],
      roles: [{ role: 'ADMIN', permissionIds: [1] }, { role: 'OPERATOR', permissionIds: [] }, { role: 'CLIENT', permissionIds: [1] }] }));
    http.match(r => r.url.endsWith('/metrics')).forEach(r => r.flush({ redemptions: 0, savings: 0 }));
    http.match(() => true).forEach(r => r.flush([]));
  }

  beforeEach(async () => {
    localStorage.setItem('auth_session', ADMIN_SESSION);
    await TestBed.configureTestingModule({
      imports: [ManagementComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { PROFILE: { ROLE: { ADMIN: 'Administrador', OPERATOR: 'Operario', CLIENT: 'Cliente' } } });
    translate.use('es');
    http = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(ManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    flushLoad();
  });

  afterEach(() => localStorage.removeItem('auth_session'));

  it('separa las cuentas habilitadas de las inhabilitadas y las cuenta', () => {
    expect(component.enabledCount).toBe(3);
    expect(component.disabledCount).toBe(1);
    expect(component.filteredUsers.map(u => u.name)).toEqual(['Ana Demo', 'Oscar Demo', 'Lucia Demo']);
    component.userFilter = 'disabled';
    expect(component.filteredUsers.map(u => u.name)).toEqual(['Pedro Demo']);
  });

  it('busca por nombre, correo o tipo de usuario en el idioma de la pantalla', () => {
    component.usersSearch = 'oscar@';
    expect(component.filteredUsers.map(u => u.name)).toEqual(['Oscar Demo']);
    component.usersSearch = 'operario';
    expect(component.filteredUsers.map(u => u.name)).toEqual(['Oscar Demo']);
    component.usersSearch = 'cliente';
    expect(component.filteredUsers.map(u => u.name)).toEqual(['Lucia Demo']);
  });

  it('no deja desactivar la cuenta propia ni otra de administrador', () => {
    const [ana, oscar] = component.users;
    expect(component.disableBlockedKey(ana)).toBe('API_ERRORS.CANNOT_DISABLE_OWN_ACCOUNT');
    expect(component.disableBlockedKey({ ...ana, id: '9' })).toBe('API_ERRORS.ADMIN_CANNOT_BE_DISABLED');
    expect(component.disableBlockedKey(oscar)).toBeNull();
  });

  it('la pestaña de roles muestra los 3 roles fijos con sus usuarios y el aviso de referencia', () => {
    expect(component.roles.map(r => [r.id, r.usersCount])).toEqual([['ADMIN', 1], ['OPERATOR', 1], ['CLIENT', 2]]);
    component.setTab('roles');
    const fixture = TestBed.createComponent(ManagementComponent);
    fixture.componentInstance.setTab('roles');
    fixture.detectChanges();
    flushLoad();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.roles-note')?.textContent).toContain('ADMIN_MANAGEMENT.ROLES.FIXED_NOTE');
  });
});
