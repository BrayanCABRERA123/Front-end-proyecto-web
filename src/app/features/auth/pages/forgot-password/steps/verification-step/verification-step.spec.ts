import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationStepComponent } from './verification-step';

describe('VerificationStep', () => {
  let component: VerificationStepComponent;
  let fixture: ComponentFixture<VerificationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
