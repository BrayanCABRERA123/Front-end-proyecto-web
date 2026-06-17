import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationOperatorComponent } from './configuration-operator';

describe('ConfigurationOperator', () => {
  let component: ConfigurationOperatorComponent;
  let fixture: ComponentFixture<ConfigurationOperatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationOperatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationOperatorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
