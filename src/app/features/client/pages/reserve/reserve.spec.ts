import { TestBed } from '@angular/core/testing';

import { ReserveComponent } from './reserve';

describe('ReserveComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({ imports: [ReserveComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ReserveComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
