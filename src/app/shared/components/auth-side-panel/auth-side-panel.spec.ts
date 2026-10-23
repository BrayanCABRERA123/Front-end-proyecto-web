import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthSidePanelComponent } from './auth-side-panel';

describe('AuthSidePanelComponent', () => {
  let component: AuthSidePanelComponent;
  let fixture: ComponentFixture<AuthSidePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthSidePanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthSidePanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
