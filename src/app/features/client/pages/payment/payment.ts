// definimos el componente
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar mensajes de éxito o error
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { Router } from '@angular/router';

// tipos para que el código sea más claro
type PaymentMethodId = 'NEQUI' | 'DAVIPLATA' | 'TRANSFER' | 'CASH';
type FlowStep = 'PENDING' | 'VERIFYING';

interface PaymentMethod {
  id: PaymentMethodId;
  icon: string;
  label: string;
  desc: string;
}

// lo que se guarda del pago para que no se pierda al recargar la página
interface SavedPaymentState {
  qrExpiresAt: number;
  flowStep: FlowStep;
  method: PaymentMethodId;
}

// vigencia del QR
const QR_DURATION_MS = 15 * 60 * 1000;

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

  // código de la reserva (viene de booking-service, pendiente)
  reservationCode: string | null = null;

  // métodos de pago disponibles (vienen de configuración del negocio, pendiente)
  paymentMethods: PaymentMethod[] = [];

  // método seleccionado por el usuario
  selectedMethod: PaymentMethodId | null = null;

  // datos de la cuenta que recibe el pago (vienen de configuración del negocio, pendiente)
  payee: { name: string; key: string; accountType: string } | null = null;

  // resumen de la reserva (viene de booking-service, pendiente)
  serviceSummary: {
    service: string;
    serviceName: string;
    serviceDesc: string;
    vehicleModel: string;
    plate: string;
    schedule: string;
    subtotal: number;
    discountPercent: number;
    coupon: string;
  } | null = null;

  get discountAmount(): number {
    if (!this.serviceSummary) return 0;
    return Math.round(this.serviceSummary.subtotal * this.serviceSummary.discountPercent / 100);
  }

  get totalToPay(): number {
    if (!this.serviceSummary) return 0;
    return this.serviceSummary.subtotal - this.discountAmount;
  }

  // temporizador del QR (15 minutos)
  // es signal porque la app es zoneless: así el setInterval repinta el contador
  qrSecondsLeft = signal(QR_DURATION_MS / 1000);
  private timerId?: ReturnType<typeof setInterval>;
  // momento exacto en que vence el QR; se guarda para que al recargar siga contando
  private qrExpiresAt = 0;

  get qrTimeLeft(): string {
    const m = Math.floor(this.qrSecondsLeft() / 60).toString().padStart(2, '0');
    const s = (this.qrSecondsLeft() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // confirmación del pago
  receiptFile: File | null = null;
  isDragging = false;
  transactionRef = '';
  // signal para que el setTimeout de copyKey() repinte el botón (zoneless)
  copied = signal(false);

  // la referencia debe tener entre 8 y 12 caracteres alfanuméricos
  get isRefValid(): boolean {
    return /^[A-Za-z0-9]{8,12}$/.test(this.transactionRef);
  }

  // el pago ya se envió y está en revisión
  get isVerifying(): boolean {
    return this.flowStep === 'VERIFYING';
  }

  get canConfirm(): boolean {
    // evita enviar el mismo pago dos veces
    if (this.isVerifying) return false;
    if (this.selectedMethod === 'CASH') return true;
    return !!this.receiptFile && this.isRefValid;
  }


  constructor(
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restoreState();
    this.updateQrSecondsLeft();

    this.timerId = setInterval(() => {
      this.updateQrSecondsLeft();
      if (this.qrSecondsLeft() === 0) clearInterval(this.timerId);
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  // calcula los segundos que faltan a partir de la hora de vencimiento
  private updateQrSecondsLeft() {
    const msLeft = this.qrExpiresAt - Date.now();
    this.qrSecondsLeft.set(Math.max(0, Math.ceil(msLeft / 1000)));
  }

  // --- estado guardado del pago ---
  // TODO: reemplazar localStorage por el estado real de la reserva cuando haya backend
  private get storageKey(): string {
    return `payment-${this.reservationCode}`;
  }

  // recupera el pago guardado o empieza uno nuevo con el QR de 15 minutos
  private restoreState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state: SavedPaymentState = JSON.parse(saved);
        this.qrExpiresAt = state.qrExpiresAt;
        this.flowStep = state.flowStep;
        this.selectedMethod = state.method;
        return;
      }
    } catch {
      // si no se puede leer, se empieza un pago nuevo
    }

    this.qrExpiresAt = Date.now() + QR_DURATION_MS;
    this.saveState();
  }

  private saveState() {
    if (!this.selectedMethod) return;
    const state: SavedPaymentState = {
      qrExpiresAt: this.qrExpiresAt,
      flowStep: this.flowStep,
      method: this.selectedMethod
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // si el navegador no permite guardar, el estado queda solo en memoria
    }
  }

  private clearState() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // nada que limpiar
    }
  }

  selectMethod(id: PaymentMethodId) {
    // con el pago en revisión ya no se puede cambiar el método
    if (this.isVerifying) return;
    this.selectedMethod = id;
    this.saveState();
  }

  copyKey() {
    if (!this.payee) return;
    navigator.clipboard?.writeText(this.payee.key.replace(/\s/g, ''));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
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
      // mostramos el error en el modal de estado (en rojo) en lugar de alert()
      this.showStatusModal({
        type: 'error',
        title: 'PAYMENT.INVALID_FILE_TITLE',
        message: 'PAYMENT.INVALID_FILE_MESSAGE'
      });
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
    this.saveState();

    // avisamos al usuario que su pago quedó enviado y en revisión
    this.showStatusModal({
      title: 'PAYMENT.SUCCESS_TITLE',
      message: 'PAYMENT.SUCCESS_MESSAGE'
    });
  }

  // abre el modal de estado (éxito o error) con los textos indicados
  private showStatusModal(data: StatusModalData, disableClose = false) {
    return this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      disableClose,
      data
    });
  }

  // pide confirmación antes de cancelar la reserva (acción irreversible)
  cancelReservation() {
    if (!this.reservationCode) return;
    const data: ConfirmModalData = {
      title: 'PAYMENT.CANCEL_CONFIRM.TITLE',
      message: 'PAYMENT.CANCEL_CONFIRM.MESSAGE',
      messageParams: { code: this.reservationCode },
      confirmText: 'PAYMENT.CANCEL_CONFIRM.CONFIRM',
      // "Volver" en vez de "Cancelar" para no confundir con "cancelar reserva"
      cancelText: 'PAYMENT.CANCEL_CONFIRM.BACK',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.onReservationCancelled();
    });
  }

  // avisa que la reserva se canceló y, al cerrar, vuelve al inicio del cliente
  private onReservationCancelled() {
    if (!this.reservationCode) return;
    // TODO: integrar cancelación real con el backend
    this.clearState();
    const dialogRef = this.showStatusModal({
      title: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_TITLE',
      message: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_MESSAGE',
      messageParams: { code: this.reservationCode }
    }, true);

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/client']);
    });
  }


}