import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
// precios de los servicios (en COP) y su formato
import { SERVICE_PRICES } from '../../../../core/constants/service-prices';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent {
  // reutiliza las claves SERVICE.* que ya existen en los JSON de idiomas
  plans = [
    {
      anchorId: 'service-basic',
      icon: 'local_car_wash',
      nameKey: 'SERVICE.BASIC',
      descKey: 'SERVICE.BASIC_DESC',
      price: SERVICE_PRICES['BASIC'],
      timeKey: 'SERVICE.BASIC_TIME',
      itemsKey: 'SERVICE.BASIC_ITEMS',
      popular: false
    },
    {
      anchorId: 'service-premium',
      icon: 'workspace_premium',
      nameKey: 'SERVICE.PREMIUM',
      descKey: 'SERVICE.PREMIUM_DESC',
      price: SERVICE_PRICES['PREMIUM'],
      timeKey: 'SERVICE.PREMIUM_TIME',
      itemsKey: 'SERVICE.PREMIUM_ITEMS',
      popular: true
    },
    {
      anchorId: 'service-full',
      icon: 'auto_awesome',
      nameKey: 'SERVICE.FULL',
      descKey: 'SERVICE.FULL_DESC',
      price: SERVICE_PRICES['FULL'],
      timeKey: 'SERVICE.FULL_TIME',
      itemsKey: 'SERVICE.FULL_ITEMS',
      popular: false
    }
  ];
}
