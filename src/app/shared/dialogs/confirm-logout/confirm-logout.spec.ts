import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmLogoutDialogComponent } from './confirm-logout';

describe('ConfirmLogoutDialogComponent', () => {
  let component: ConfirmLogoutDialogComponent;
  let fixture: ComponentFixture<ConfirmLogoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmLogoutDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmLogoutDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
