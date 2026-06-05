import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationOperarioComponent } from './configuration-operario';

describe('ConfigurationOperario', () => {
  let component: ConfigurationOperarioComponent;
  let fixture: ComponentFixture<ConfigurationOperarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationOperarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationOperarioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
