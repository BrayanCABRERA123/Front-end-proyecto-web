import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCardComponent } from './auth-card';

describe('AuthCard', () => {
  let component: AuthCardComponent;
  let fixture: ComponentFixture<AuthCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
