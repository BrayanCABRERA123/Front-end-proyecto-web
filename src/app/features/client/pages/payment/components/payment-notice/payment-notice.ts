import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// aviso grande arriba de la pantalla de pago: pago aprobado (verde), último pago rechazado (rojo)
// o plazo / efectivo (amarillo)
@Component({
  selector: 'app-payment-notice',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './payment-notice.html',
  styleUrl: './payment-notice.scss'
})
export class PaymentNoticeComponent {
  @Input() tone: 'success' | 'error' | 'warning' = 'success';
  @Input() icon = 'verified';
  @Input() title = '';
  @Input() message = '';
}
