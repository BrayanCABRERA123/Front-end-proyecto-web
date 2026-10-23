import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';
import { VerificationStepComponent } from './verification-step';

describe('VerificationStep', () => {
  let component: VerificationStepComponent;
  let fixture: ComponentFixture<VerificationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationStepComponent],
      // el paso usa el ViewModel que provee la pantalla de recuperar contraseña
      providers: [ForgotPasswordViewModel],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
