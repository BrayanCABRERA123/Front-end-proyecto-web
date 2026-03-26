import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationStep } from './verification-step';

describe('VerificationStep', () => {
  let component: VerificationStep;
  let fixture: ComponentFixture<VerificationStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationStep],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
