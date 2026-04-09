import { ComponentFixture, TestBed } from '@angular/core/testing';

import { notificationsComponent } from './notifications';

describe('Payments', () => {
    let component: notificationsComponent;
    let fixture: ComponentFixture<notificationsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [notificationsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(notificationsComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
