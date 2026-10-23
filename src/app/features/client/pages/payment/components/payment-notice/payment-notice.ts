import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// aviso grande arriba de la pantalla de pago: pago aprobado (verde) o último pago rechazado (rojo)
@Component({
  selector: 'app-payment-notice',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './payment-notice.html',
  styleUrl: './payment-notice.scss'
})
export class PaymentNoticeComponent {
  @Input() tone: 'success' | 'error' = 'success';
  @Input() icon = 'verified';
  @Input() title = '';
  @Input() message = '';
}
