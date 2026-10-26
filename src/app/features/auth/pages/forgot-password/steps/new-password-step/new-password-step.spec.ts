import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';
import { NewPasswordStepComponent } from './new-password-step';

describe('NewPasswordStep', () => {
  let component: NewPasswordStepComponent;
  let fixture: ComponentFixture<NewPasswordStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPasswordStepComponent],
      // el paso usa el ViewModel que provee la pantalla de recuperar contraseña
      providers: [ForgotPasswordViewModel],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPasswordStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('WEB-12: ver/ocultar usan mat-icon con aria-label y cada uno sigue a su propio campo', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('iconify-icon')).toBeNull();
    const [newToggle, confirmToggle] = Array.from(el.querySelectorAll<HTMLButtonElement>('button.toggle-password'));
    expect(newToggle.getAttribute('aria-label')).toBeTruthy();
    expect(el.querySelector('label[for="forgot-new-password"]')).not.toBeNull();

    confirmToggle.click();
    fixture.detectChanges();

    expect(confirmToggle.getAttribute('aria-pressed')).toBe('true');
    expect(newToggle.getAttribute('aria-pressed')).toBe('false');
    expect(confirmToggle.querySelector('mat-icon')?.textContent?.trim()).toBe('visibility');
    expect(newToggle.querySelector('mat-icon')?.textContent?.trim()).toBe('visibility_off');
  });
});
