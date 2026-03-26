import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailStepComponent } from './email-step';

describe('EmailStep', () => {
  let component: EmailStepComponent;
  let fixture: ComponentFixture<EmailStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
