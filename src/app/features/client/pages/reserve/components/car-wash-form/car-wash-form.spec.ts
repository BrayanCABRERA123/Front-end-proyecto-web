import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarWashFormComponent } from './car-wash-form';

describe('CarWashFormComponent', () => {
  let component: CarWashFormComponent;
  let fixture: ComponentFixture<CarWashFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarWashFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarWashFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
