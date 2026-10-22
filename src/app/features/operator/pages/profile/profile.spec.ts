import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile';
import { UserSession } from '../../../../core/services/user-session';

describe('Profile', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra al operario de la sesión, no datos inventados', () => {
    TestBed.inject(UserSession).update({ name: 'Oscar Ruiz', email: 'oscar.ruiz@gmail.com', phone: '', address: '' });

    expect(component.user().name).toBe('Oscar Ruiz');
    expect(component.user().email).toBe('oscar.ruiz@gmail.com');
    expect(component.user().initials).toBe('OR');
    expect(component.user().address).toBe('');
  });
});
