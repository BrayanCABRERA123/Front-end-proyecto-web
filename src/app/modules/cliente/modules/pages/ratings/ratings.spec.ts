import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingsComponent } from './ratings';

describe('Ratings', () => {
  let component: RatingsComponent;
  let fixture: ComponentFixture<RatingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
