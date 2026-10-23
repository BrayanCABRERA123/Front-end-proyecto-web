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
});
