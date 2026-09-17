// definimos el componente
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../../core/services/api';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit {

  // id del cliente logueado; 2 (Juan Díaz) es el demo por defecto si nadie inició sesión
  private get userId(): number {
    return this.auth.getCurrentUser()?.id ?? 2;
  }

  constructor(private api: Api, private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getClientPayments(this.userId).subscribe(historialPagos => {
      this.historialPagos = historialPagos;
      this.cdr.detectChanges();
    });
  }

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

  // historial de pagos del cliente (viene de la API mock)
  historialPagos: any[] = [];

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
