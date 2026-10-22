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

  it('muestra al operario de la sesión, no datos inventados', async () => {
    TestBed.inject(UserSession).update({ name: 'Oscar Ruiz', email: 'oscar.ruiz@gmail.com', phone: '', address: '' });
    // la tarjeta toma la sesión al crearse, mientras llega lo del backend
    const page = TestBed.createComponent(ProfileComponent);
    await page.whenStable();
    const html: HTMLElement = page.nativeElement;

    expect(html.querySelector('.user-name')?.textContent?.trim()).toBe('Oscar Ruiz');
    expect(html.querySelector('.avatar')?.textContent?.trim()).toBe('OR');
    expect(html.querySelector<HTMLInputElement>('input[formcontrolname="email"]')?.value).toBe('oscar.ruiz@gmail.com');
    expect(html.querySelector<HTMLInputElement>('input[formcontrolname="address"]')?.value).toBe('');
  });
});
