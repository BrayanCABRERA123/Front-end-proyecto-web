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
  metodosPago = [
    { id: 'CARD', icono: 'credit_card', label: 'PAYMENT.METHOD.CARD', desc: 'PAYMENT.METHOD.CARD_DESC' },
    { id: 'PAYPAL', icono: 'account_balance_wallet', label: 'PAYMENT.METHOD.PAYPAL', desc: 'PAYMENT.METHOD.PAYPAL_DESC' },
    { id: 'TRANSFER', icono: 'account_balance', label: 'PAYMENT.METHOD.TRANSFER', desc: 'PAYMENT.METHOD.TRANSFER_DESC' }
  ];

  // método seleccionado por el usuario
  metodoSeleccionado = 'CARD';

  // datos del formulario de tarjeta
  tarjeta = {
    nombre: '',
    numero: '',
    vencimiento: '',
    cvv: ''
  };

  // resumen del servicio a pagar
  resumenServicio = {
    servicio: 'PREMIUM',
    vehiculo: 'CAR',
    placa: 'ABC123',
    base: 45000,
    domicilio: 6000
  };

  get totalAPagar(): number {
    return this.resumenServicio.base + this.resumenServicio.domicilio;
  }

  // historial de pagos del cliente
  historialPagos = [
    { codigo: 'PG-5012', tipo: 'PREMIUM', vehiculo: 'CAR', fecha: '12 Ago 2026', metodo: 'Tarjeta ••4821', monto: 45000, estado: 'PAID' },
    { codigo: 'PG-5008', tipo: 'BASIC', vehiculo: 'MOTO', fecha: '05 Ago 2026', metodo: 'PayPal', monto: 18000, estado: 'PAID' },
    { codigo: 'PG-4990', tipo: 'FULL', vehiculo: 'TRUCK', fecha: '28 Jul 2026', metodo: 'Transferencia', monto: 72000, estado: 'PENDING' },
    { codigo: 'PG-4975', tipo: 'PREMIUM', vehiculo: 'CAR', fecha: '19 Jul 2026', metodo: 'Tarjeta ••4821', monto: 45000, estado: 'REFUNDED' },
    { codigo: 'PG-4960', tipo: 'BASIC', vehiculo: 'CAR', fecha: '08 Jul 2026', metodo: 'Tarjeta ••4821', monto: 22000, estado: 'PAID' }
  ];

  get totalPagado(): number {
    return this.historialPagos
      .filter(p => p.estado === 'PAID')
      .reduce((sum, p) => sum + p.monto, 0);
  }

  seleccionarMetodo(id: string) {
    this.metodoSeleccionado = id;
  }

  pagar() {
    // TODO: integrar con el backend de pagos (Commercial service)
    console.log('Procesando pago por', this.totalAPagar, 'con método', this.metodoSeleccionado);
  }

  descargarComprobante(codigo: string) {
    // TODO: integrar descarga real del comprobante
    console.log('Descargando comprobante de', codigo);
  }

}
