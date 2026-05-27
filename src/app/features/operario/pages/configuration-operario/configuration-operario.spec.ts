import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationOperario } from './configuration-operario';

describe('ConfigurationOperario', () => {
  let component: ConfigurationOperario;
  let fixture: ComponentFixture<ConfigurationOperario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationOperario],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationOperario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
