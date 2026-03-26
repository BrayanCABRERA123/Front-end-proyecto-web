import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPasswordStep } from './new-password-step';

describe('NewPasswordStep', () => {
  let component: NewPasswordStep;
  let fixture: ComponentFixture<NewPasswordStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPasswordStep],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPasswordStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
