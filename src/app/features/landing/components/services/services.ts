import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesComponent {
  // reutiliza las claves SERVICE.* que ya existen en los JSON de idiomas
  plans = [
    {
      anchorId: 'servicio-basico',
      icon: 'local_car_wash',
      nameKey: 'SERVICE.BASIC',
      descKey: 'SERVICE.BASIC_DESC',
      priceKey: 'SERVICE.BASIC_PRICE',
      timeKey: 'SERVICE.BASIC_TIME',
      itemsKey: 'SERVICE.BASIC_ITEMS',
      popular: false
    },
    {
      anchorId: 'servicio-premium',
      icon: 'workspace_premium',
      nameKey: 'SERVICE.PREMIUM',
      descKey: 'SERVICE.PREMIUM_DESC',
      priceKey: 'SERVICE.PREMIUM_PRICE',
      timeKey: 'SERVICE.PREMIUM_TIME',
      itemsKey: 'SERVICE.PREMIUM_ITEMS',
      popular: true
    },
    {
      anchorId: 'servicio-completo',
      icon: 'auto_awesome',
      nameKey: 'SERVICE.FULL',
      descKey: 'SERVICE.FULL_DESC',
      priceKey: 'SERVICE.FULL_PRICE',
      timeKey: 'SERVICE.FULL_TIME',
      itemsKey: 'SERVICE.FULL_ITEMS',
      popular: false
    }
  ];
}
