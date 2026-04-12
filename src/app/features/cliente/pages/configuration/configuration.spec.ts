import { ComponentFixture, TestBed } from '@angular/core/testing';

import { configurationComponent} from './configuration';

describe('Configuration', () => {
  let component: configurationComponent;
  let fixture: ComponentFixture<configurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [configurationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(configurationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
