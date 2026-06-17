import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingModalComponent } from './rating-modal';

describe('Ratings', () => {
  let component: RatingModalComponent;
  let fixture: ComponentFixture<RatingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatingModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
