// definimos el componente
import { Component, OnDestroy, OnInit } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

// tipos para que el código sea más claro
type PaymentMethodId = 'NEQUI' | 'DAVIPLATA' | 'TRANSFER' | 'CASH';
type FlowStep = 'PENDING' | 'VERIFYING';

interface PaymentMethod {
  id: PaymentMethodId;
  icon: string;
  label: string;
  desc: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, FormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {

  // estado del pago: pendiente de confirmación o en verificación
  flowStep: FlowStep = 'PENDING';

  // código de la reserva
  reservationCode = 'RES-9420';

  // métodos de pago disponibles
  paymentMethods: PaymentMethod[] = [
    { id: 'NEQUI', icon: 'smartphone', label: 'PAYMENT.METHOD.NEQUI', desc: 'PAYMENT.METHOD.NEQUI_DESC' },
    { id: 'DAVIPLATA', icon: 'account_balance', label: 'PAYMENT.METHOD.DAVIPLATA', desc: 'PAYMENT.METHOD.DAVIPLATA_DESC' },
    { id: 'TRANSFER', icon: 'receipt_long', label: 'PAYMENT.METHOD.TRANSFER', desc: 'PAYMENT.METHOD.TRANSFER_DESC' },
    { id: 'CASH', icon: 'payments', label: 'PAYMENT.METHOD.CASH', desc: 'PAYMENT.METHOD.CASH_DESC' }
  ];

  // método seleccionado por el usuario
  selectedMethod: PaymentMethodId = 'NEQUI';

  // datos de la cuenta que recibe el pago
  payee = {
    name: 'Lavado Vehicular S.A.S.',
    key: '318 450 9988',
    accountType: 'PAYMENT.QR.ACCOUNT_TYPE_VALUE'
  };

  // resumen de la reserva
  serviceSummary = {
    service: 'PREMIUM',
    serviceName: 'Lavado Premium Automóvil',
    serviceDesc: 'PAYMENT.SUMMARY.PREMIUM_DESC',
    vehicleModel: 'Mazda CX-30',
    plate: 'KLL-302',
    schedule: 'Hoy, 24 Octubre 2024 · 14:00 - 15:15',
    subtotal: 60000,
    discountPercent: 15,
    coupon: 'BIENVENIDO15'
  };

  get discountAmount(): number {
    return Math.round(this.serviceSummary.subtotal * this.serviceSummary.discountPercent / 100);
  }

  get totalToPay(): number {
    return this.serviceSummary.subtotal - this.discountAmount;
  }

  // temporizador del QR (15 minutos)
  qrSecondsLeft = 15 * 60;
  private timerId?: ReturnType<typeof setInterval>;

  get qrTimeLeft(): string {
    const m = Math.floor(this.qrSecondsLeft / 60).toString().padStart(2, '0');
    const s = (this.qrSecondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // confirmación del pago
  receiptFile: File | null = null;
  isDragging = false;
  transactionRef = '';
  copied = false;

  // la referencia debe tener entre 8 y 12 caracteres alfanuméricos
  get isRefValid(): boolean {
    return /^[A-Za-z0-9]{8,12}$/.test(this.transactionRef);
  }

  get canConfirm(): boolean {
    if (this.selectedMethod === 'CASH') return true;
    return !!this.receiptFile && this.isRefValid;
  }


  ngOnInit(): void {
    this.timerId = setInterval(() => {
      if (this.qrSecondsLeft > 0) this.qrSecondsLeft--;
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  selectMethod(id: PaymentMethodId) {
    this.selectedMethod = id;
  }

  copyKey() {
    navigator.clipboard?.writeText(this.payee.key.replace(/\s/g, ''));
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  // --- subida del comprobante ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setReceipt(file);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setReceipt(file);
  }

  private setReceipt(file: File) {
    const validType = ['image/jpeg', 'image/png'].includes(file.type);
    const validSize = file.size <= 10 * 1024 * 1024;
    if (!validType || !validSize) {
      alert('Solo JPG o PNG de máximo 10MB');
      return;
    }
    this.receiptFile = file;
  }

  removeReceipt() {
    this.receiptFile = null;
  }

  get receiptSize(): string {
    if (!this.receiptFile) return '';
    return (this.receiptFile.size / (1024 * 1024)).toFixed(1) + 'MB';
  }

  confirmPayment() {
    if (!this.canConfirm) return;
    // TODO: integrar con el backend de pagos (Commercial service)
    console.log('Confirmando pago', {
      reserva: this.reservationCode,
      metodo: this.selectedMethod,
      referencia: this.transactionRef,
      monto: this.totalToPay,
      comprobante: this.receiptFile?.name
    });
    this.flowStep = 'VERIFYING';
  }

  cancelReservation() {
    // TODO: integrar cancelación real
    console.log('Cancelando reserva', this.reservationCode);
  }


}