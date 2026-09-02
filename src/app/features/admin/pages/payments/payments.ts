// definimos el componente de gestión de pagos
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentModalComponent, PagoManual } from './components/payment-modal/payment-modal';

// métodos de pago soportados
type MetodoPago = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CASH';

// estructura de un pago
interface Pago {
  id: string;
  servicio: string;
  monto: number;
  metodoPago: MetodoPago;
  fecha: string;
  cliente: string;
  verificado: boolean;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, TranslateModule, PaymentModalComponent],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent {

  // filtros de rango de fechas
  filtroDesde = '';
  filtroHasta = '';

  // controla la visibilidad del modal de registro manual
  modalAbierto = false;

  // listado de pagos (mock, se reemplaza luego con datos del backend)
  pagos: Pago[] = [
    { id: 'P001', servicio: 'Lavado completo', monto: 250, metodoPago: 'CREDIT_CARD', fecha: '2026-05-10', cliente: 'Juan Pérez', verificado: false },
    { id: 'P002', servicio: 'Pulido', monto: 320, metodoPago: 'BANK_TRANSFER', fecha: '2026-05-09', cliente: 'María García', verificado: true },
    { id: 'P003', servicio: 'Encerado', monto: 150, metodoPago: 'PAYPAL', fecha: '2026-05-08', cliente: 'Carlos López', verificado: false },
    { id: 'P004', servicio: 'Lavado básico', monto: 80, metodoPago: 'CASH', fecha: '2026-05-07', cliente: 'Ana Martínez', verificado: true }
  ];

  // configuración visual de cada método de pago (ícono + clase de color)
  private metodosConfig: Record<MetodoPago, { icono: string; clase: string }> = {
    CREDIT_CARD: { icono: 'credit_card', clase: 'metodo-tarjeta' },
    BANK_TRANSFER: { icono: 'account_balance', clase: 'metodo-transferencia' },
    PAYPAL: { icono: 'account_balance_wallet', clase: 'metodo-paypal' },
    CASH: { icono: 'payments', clase: 'metodo-efectivo' }
  };

  // total recaudado: suma de todos los pagos registrados
  get totalRecaudado(): number {
    return this.pagos.reduce((suma, pago) => suma + pago.monto, 0);
  }

  // cantidad de pagos ya verificados
  get pagosVerificados(): number {
    return this.pagos.filter(pago => pago.verificado).length;
  }

  // cantidad de pagos pendientes por verificar
  get pagosPendientes(): number {
    return this.pagos.filter(pago => !pago.verificado).length;
  }

  // devuelve el ícono correspondiente al método de pago
  iconoMetodo(metodo: MetodoPago): string {
    return this.metodosConfig[metodo].icono;
  }

  // devuelve la clase css para el color del método de pago
  claseMetodo(metodo: MetodoPago): string {
    return this.metodosConfig[metodo].clase;
  }

  // marca un pago como verificado
  verificarPago(pago: Pago): void {
    // TODO: integrar con el backend para confirmar la verificación del pago
    pago.verificado = true;
  }

  // aplica el filtro de rango de fechas sobre la lista de pagos
  aplicarFiltros(): void {
    // TODO: integrar con el backend para filtrar pagos por rango de fechas
    console.log('Filtros aplicados', { desde: this.filtroDesde, hasta: this.filtroHasta });
  }

  // abre el modal de registro manual de un pago
  registroManual(): void {
    this.modalAbierto = true;
  }

  // cierra el modal de registro manual sin guardar
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // recibe el pago emitido por el modal, genera un id y lo agrega a la lista
  onRegistrarPago(pago: PagoManual): void {
    const nuevoId = 'P' + String(this.pagos.length + 1).padStart(3, '0');
    this.pagos = [
      {
        id: nuevoId,
        servicio: pago.servicio,
        monto: pago.monto,
        metodoPago: pago.metodoPago,
        fecha: new Date().toISOString().slice(0, 10),
        cliente: pago.cliente,
        verificado: false
      },
      ...this.pagos
    ];
    // TODO: reemplazar con la llamada real al backend para persistir el pago
    this.modalAbierto = false;
  }

}
