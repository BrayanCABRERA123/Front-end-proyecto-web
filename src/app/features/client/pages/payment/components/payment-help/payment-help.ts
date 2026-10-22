import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// tarjeta de ayuda del pago: la línea de soporte la trae PaymentViewModel de los datos del negocio,
// la misma que el admin edita en Configuración → Datos del negocio
@Component({
  selector: 'app-payment-help',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './payment-help.html',
  styleUrl: './payment-help.scss'
})
export class PaymentHelpComponent {
  readonly supportLine = input('');
}
