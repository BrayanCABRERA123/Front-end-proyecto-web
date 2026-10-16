import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// lo que le falta al cliente para poder confirmar el pago (debajo del botón bloqueado)
@Component({
  selector: 'app-payment-missing',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './payment-missing.html',
  styleUrl: './payment-missing.scss'
})
export class PaymentMissingComponent {
  // llaves de traducción de cada requisito pendiente
  @Input() items: string[] = [];
}
