// definimos el componente
import { Component } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent {

  // métodos de pago disponibles
  paymentMethods = [
    { id: 'CARD', icon: 'credit_card', label: 'PAYMENT.METHOD.CARD', desc: 'PAYMENT.METHOD.CARD_DESC' },
    { id: 'PAYPAL', icon: 'account_balance_wallet', label: 'PAYMENT.METHOD.PAYPAL', desc: 'PAYMENT.METHOD.PAYPAL_DESC' },
    { id: 'TRANSFER', icon: 'account_balance', label: 'PAYMENT.METHOD.TRANSFER', desc: 'PAYMENT.METHOD.TRANSFER_DESC' }
  ];

  // método seleccionado por el usuario
  selectedMethod = 'CARD';

  // datos del formulario de tarjeta
  card = {
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  };

  // resumen del servicio a pagar
  serviceSummary = {
    service: 'PREMIUM',
    vehicle: 'CAR',
    plate: 'ABC123',
    base: 45000,
    deliveryFee: 6000
  };

  get totalToPay(): number {
    return this.serviceSummary.base + this.serviceSummary.deliveryFee;
  }

  // historial de pagos del cliente
  paymentHistory = [
    { code: 'PG-5012', type: 'PREMIUM', vehicle: 'CAR', date: '12 Ago 2026', method: 'Tarjeta ••4821', amount: 45000, status: 'PAID' },
    { code: 'PG-5008', type: 'BASIC', vehicle: 'MOTO', date: '05 Ago 2026', method: 'PayPal', amount: 18000, status: 'PAID' },
    { code: 'PG-4990', type: 'FULL', vehicle: 'TRUCK', date: '28 Jul 2026', method: 'Transferencia', amount: 72000, status: 'PENDING' },
    { code: 'PG-4975', type: 'PREMIUM', vehicle: 'CAR', date: '19 Jul 2026', method: 'Tarjeta ••4821', amount: 45000, status: 'REFUNDED' },
    { code: 'PG-4960', type: 'BASIC', vehicle: 'CAR', date: '08 Jul 2026', method: 'Tarjeta ••4821', amount: 22000, status: 'PAID' }
  ];

  get totalPaid(): number {
    return this.paymentHistory
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  selectMethod(id: string) {
    this.selectedMethod = id;
  }

  pay() {
    // TODO: integrar con el backend de pagos (Commercial service)
    console.log('Procesando pago por', this.totalToPay, 'con método', this.selectedMethod);
  }

  downloadReceipt(code: string) {
    // TODO: integrar descarga real del comprobante
    console.log('Descargando comprobante de', code);
  }

}
