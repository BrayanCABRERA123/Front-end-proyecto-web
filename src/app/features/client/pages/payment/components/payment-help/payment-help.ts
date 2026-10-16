import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { BookingApiService } from '../../../../../../core/services/booking-api';

// tarjeta de ayuda del pago: la línea de soporte sale de los datos del negocio (booking-service),
// la misma que el admin edita en Configuración → Datos del negocio
@Component({
  selector: 'app-payment-help',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './payment-help.html',
  styleUrl: './payment-help.scss'
})
export class PaymentHelpComponent implements OnInit {
  private readonly bookingApi = inject(BookingApiService);

  readonly supportLine = signal('');

  ngOnInit(): void {
    this.bookingApi.establishment().subscribe({
      next: business => this.supportLine.set(business.supportLine || business.phone || ''),
      error: () => undefined
    });
  }
}
