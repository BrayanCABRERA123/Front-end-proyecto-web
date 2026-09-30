import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
// el precio sale del catálogo del booking-service; aquí solo se formatea
import { BookingApiService } from '../../../../core/services/booking-api';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent implements OnInit {

  private readonly bookingApi = inject(BookingApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // tipo de vehículo de referencia para el precio "desde" (1 = automóvil en customer-service)
  private static readonly REFERENCE_VEHICLE_TYPE = 1;

  // reutiliza las claves SERVICE.* que ya existen en los JSON de idiomas
  plans = [
    {
      anchorId: 'service-basic',
      icon: 'local_car_wash',
      nameKey: 'SERVICE.BASIC',
      descKey: 'SERVICE.BASIC_DESC',
      code: 'BASIC',
      price: null as number | null,
      timeKey: 'SERVICE.BASIC_TIME',
      itemsKey: 'SERVICE.BASIC_ITEMS',
      popular: false
    },
    {
      anchorId: 'service-premium',
      icon: 'workspace_premium',
      nameKey: 'SERVICE.PREMIUM',
      descKey: 'SERVICE.PREMIUM_DESC',
      code: 'PREMIUM',
      price: null as number | null,
      timeKey: 'SERVICE.PREMIUM_TIME',
      itemsKey: 'SERVICE.PREMIUM_ITEMS',
      popular: true
    },
    {
      anchorId: 'service-full',
      icon: 'auto_awesome',
      nameKey: 'SERVICE.FULL',
      descKey: 'SERVICE.FULL_DESC',
      code: 'FULL',
      price: null as number | null,
      timeKey: 'SERVICE.FULL_TIME',
      itemsKey: 'SERVICE.FULL_ITEMS',
      popular: false
    }
  ];

  // precios reales del catálogo, emparejados por código del servicio
  ngOnInit(): void {
    this.bookingApi.services(ServicesComponent.REFERENCE_VEHICLE_TYPE).subscribe({
      next: (services) => {
        for (const plan of this.plans) {
          plan.price = services.find(s => s.code === plan.code)?.prices[0]?.price ?? null;
        }
        this.cdr.markForCheck();
      },
      error: () => { /* sin backend la tarjeta muestra el precio vacío */ }
    });
  }
}
