import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarWashForm } from './car-wash-form';

describe('CarWashForm', () => {
  let component: CarWashForm;
  let fixture: ComponentFixture<CarWashForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarWashForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CarWashForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
