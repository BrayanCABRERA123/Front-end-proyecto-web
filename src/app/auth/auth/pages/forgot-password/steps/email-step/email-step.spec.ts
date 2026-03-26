import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailStep } from './email-step';

describe('EmailStep', () => {
  let component: EmailStep;
  let fixture: ComponentFixture<EmailStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailStep],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
