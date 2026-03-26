import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPasswordStepComponent } from './new-password-step';

describe('NewPasswordStep', () => {
  let component: NewPasswordStepComponent;
  let fixture: ComponentFixture<NewPasswordStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPasswordStepComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPasswordStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
