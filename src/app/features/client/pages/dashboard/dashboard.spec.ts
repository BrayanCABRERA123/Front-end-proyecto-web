import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { DashboardComponent } from './dashboard';

function promotion(id: number, name: string, discountPercent: number, requiredPoints: number, unlocked: boolean) {
  return { id, code: `P${id}`, name, description: null, icon: null, featured: false, benefits: [], discountPercent, requiredPoints, unlocked };
}

describe('DashboardComponent (cliente)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** responde el saldo y las promociones; el resto de la carga del panel queda vacía */
  function answerLoyalty(points: number, promotions: object[]): void {
    http.expectOne(r => r.url.endsWith('/loyalty/balance')).flush({ points });
    http.expectOne(r => r.url.endsWith('/loyalty/promotions')).flush(promotions);
    http.match(() => true).forEach(r => r.flush([]));
  }

  it('la barra apunta a la siguiente promoción bloqueada', () => {
    answerLoyalty(30, [promotion(1, 'Encerado', 10, 20, true), promotion(2, 'Full', 25, 120, false)]);

    expect(component.vm.loyalty()).toEqual({ current: 30, goal: 120, percentage: 25 });
    expect(component.vm.benefits().map(b => b.title)).toEqual(['Encerado · 10% OFF', 'Full · 25% OFF']);
  });

  it('sin nada por desbloquear la barra queda completa y no inventa una meta', () => {
    answerLoyalty(0, [promotion(1, 'Lavado con champú', 0, 0, true)]);

    expect(component.vm.loyalty()).toEqual({ current: 0, goal: 0, percentage: 100, allUnlocked: true });
    // una promoción sin porcentaje no muestra "0% OFF"
    expect(component.vm.benefits()[0].title).toBe('Lavado con champú');
  });
});
