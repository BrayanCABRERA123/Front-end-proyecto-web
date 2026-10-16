import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComponent } from './dashboard';

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    localStorage.setItem('auth_session', JSON.stringify({
      accessToken: 'token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 1, email: 'admin@gmail.com', documentNumber: '1', firstName: 'Ana', lastName: 'Ruiz',
        phone: null, roles: ['ADMIN'], active: true, lastLogin: null },
    }));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.removeItem('auth_session'));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('saluda con el primer nombre de quien inició sesión', () => {
    expect(component.adminName).toBe('Ana');
  });
});
