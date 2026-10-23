import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordViewModel } from '../../../../viewmodels/forgot-password.viewmodel';
import { EmailStepComponent } from './email-step';

describe('EmailStep', () => {
  let component: EmailStepComponent;
  let fixture: ComponentFixture<EmailStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailStepComponent],
      // el paso usa el ViewModel que provee la pantalla de recuperar contraseña
      providers: [ForgotPasswordViewModel],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
