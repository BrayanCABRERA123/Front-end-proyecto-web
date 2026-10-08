// definimos el componente
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar mensajes de éxito o error
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
// datos reales de la reserva (booking-service)
import { BookingApiService } from '../../../../core/services/booking-api';
import { BookingResponse } from '../../../../core/models/booking.models';
import { isActiveStatus, isoToDisplayDate, servicesLabel, vehicleLabel } from '../../../../core/utils/booking-display';
import { apiErrorKey } from '../../../../core/utils/api-error';
// cuentas del lavadero y reporte del pago (payment-service)
import { PaymentAccountResponse, PaymentsApiService, readImageAsDataUrl } from '../../../../core/services/payments-api';
// canje de cupón de fidelización (payment-service, ADR-015)
import { LoyaltyApiService, RedeemPromotionResult } from '../../../../core/services/loyalty-api';

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

// efectivo siempre está: se paga en el lavadero
const CASH_METHOD: PaymentMethod = { id: 'CASH', icon: 'payments', label: 'PAYMENT.METHOD.CASH', desc: 'PAYMENT.METHOD.CASH_DESC' };

/** medio de la pantalla para el código de payment-service */
function methodIdOf(code: string): PaymentMethodId {
  if (code === 'NEQUI') return 'NEQUI';
  if (code === 'DAVIPLATA') return 'DAVIPLATA';
  if (code === 'EFECTIVO') return 'CASH';
  return 'TRANSFER';
}

function methodOptionOf(account: PaymentAccountResponse): PaymentMethod | null {
  const id = methodIdOf(account.methodCode);
  if (id === 'CASH') return null;
  const icon = id === 'NEQUI' ? 'smartphone' : id === 'DAVIPLATA' ? 'account_balance' : 'receipt_long';
  return { id, icon, label: 'PAYMENT.METHOD.' + id, desc: 'PAYMENT.METHOD.' + id + '_DESC' };
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

  private readonly bookingApi = inject(BookingApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly loyaltyApi = inject(LoyaltyApiService);

  // cuentas activas del lavadero (payment-service); cada medio tiene su titular, número y QR
  private accounts: PaymentAccountResponse[] = [];
  private readonly route = inject(ActivatedRoute);
  private readonly changes = inject(ChangeDetectorRef);

  // reserva que se está pagando (viene de booking-service)
  booking: BookingResponse | null = null;
  loading = false;
  notFound = false;
  loadError: string | null = null;
  private bookingId: number | null = null;

  // estado del pago: pendiente de confirmación o en verificación
  flowStep: FlowStep = 'PENDING';

  // código de la reserva (lo llena el backend)
  reservationCode = '';

  // medios disponibles: los que el admin tiene activos, más efectivo en el lavadero
  paymentMethods: PaymentMethod[] = [CASH_METHOD];

  // método seleccionado por el usuario
  selectedMethod: PaymentMethodId = 'CASH';

  // cuenta del medio elegido (su QR es el que se muestra)
  get selectedAccount(): PaymentAccountResponse | null {
    return this.accounts.find(a => methodIdOf(a.methodCode) === this.selectedMethod) ?? null;
  }

  // datos de la cuenta que recibe el pago
  get payee() {
    const account = this.selectedAccount;
    return {
      name: account?.accountHolder ?? '',
      key: account?.accountNumber ?? '',
      accountType: 'PAYMENT.QR.ACCOUNT_TYPE_VALUE'
    };
  }

  // resumen real de la reserva (se llena en applyBooking)
  serviceSummary = {
    serviceName: '',
    vehicleModel: '',
    plate: '',
    schedule: '',
    subtotal: 0,
    // descuento por puntos redimidos (booking.pointsDiscountAmount)
    pointsDiscount: 0
  };

  get totalToPay(): number {
    const couponDiscount = this.couponResult?.discountAmount ?? 0;
    return Math.max(0, this.serviceSummary.subtotal - this.serviceSummary.pointsDiscount - couponDiscount);
  }

  // --- canje de cupón de fidelización (payment-service, ADR-015) ---
  couponCode = '';
  couponResult: RedeemPromotionResult | null = null;
  couponError: string | null = null;
  redeemingCoupon = false;

  get canRedeemCoupon(): boolean {
    return !this.isVerifying && !this.couponResult && !this.redeemingCoupon && this.couponCode.trim().length >= 3;
  }

  redeemCoupon(): void {
    if (!this.canRedeemCoupon || !this.booking) return;
    this.redeemingCoupon = true;
    this.couponError = null;
    this.loyaltyApi.redeem(this.booking.id, this.couponCode.trim().toUpperCase()).subscribe({
      next: (result) => {
        this.couponResult = result;
        this.redeemingCoupon = false;
        this.changes.markForCheck();
      },
      error: (error) => {
        this.couponError = apiErrorKey(error);
        this.redeemingCoupon = false;
        this.changes.markForCheck();
      }
    });
  }

  removeCoupon(): void {
    this.couponResult = null;
    this.couponCode = '';
    this.couponError = null;
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
    this.bookingId = Number(this.route.snapshot.queryParamMap.get('booking')) || null;

    // cuentas reales del lavadero (con su QR)
    this.paymentsApi.accounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        const digital = accounts.map(a => methodOptionOf(a)).filter((m): m is PaymentMethod => !!m);
        this.paymentMethods = [...digital, CASH_METHOD];
        if (!this.isVerifying) this.selectedMethod = this.paymentMethods[0].id;
        this.changes.markForCheck();
      },
      error: () => { /* sin payment-service solo queda efectivo */ }
    });

    this.loadBooking();
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  // trae las reservas del cliente y elige la que se va a pagar
  private loadBooking(): void {
    this.loading = true;
    this.loadError = null;
    this.bookingApi.myBookings().subscribe({
      next: (bookings) => {
        this.loading = false;
        const booking = this.pickBooking(bookings);
        if (!booking) {
          this.notFound = true;
          this.changes.markForCheck();
          return;
        }
        this.booking = booking;
        this.applyBooking(booking);
        this.startQrTimer();
        this.loadPaymentState(booking.id);
        this.changes.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.loadError = apiErrorKey(error);
        this.changes.markForCheck();
      }
    });
  }

  // con id en la URL se paga esa reserva; sin id, la primera activa (o la más reciente)
  private pickBooking(bookings: BookingResponse[]): BookingResponse | null {
    if (this.bookingId) {
      return bookings.find(booking => booking.id === this.bookingId) ?? null;
    }
    const bySchedule = (a: BookingResponse, b: BookingResponse) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
    const active = [...bookings].filter(booking => isActiveStatus(booking.status)).sort(bySchedule);
    return active[0] ?? [...bookings].sort(bySchedule).reverse()[0] ?? null;
  }

  private applyBooking(booking: BookingResponse): void {
    this.reservationCode = booking.code;
    this.serviceSummary = {
      serviceName: servicesLabel(booking),
      vehicleModel: vehicleLabel(booking.vehicle),
      plate: booking.vehicle?.licensePlateFormatted ?? '',
      schedule: `${isoToDisplayDate(booking.date)} · ${booking.startTime} - ${booking.endTime}`,
      subtotal: booking.subtotal,
      pointsDiscount: booking.pointsDiscountAmount
    };

    this.restoreState();
    this.updateQrSecondsLeft();
  }

  // si ya hay un pago reportado para esta reserva, la pantalla queda en revisión
  private loadPaymentState(bookingId: number): void {
    this.paymentsApi.mine().subscribe({
      next: (payments) => {
        const current = payments.find(p => p.booking?.id === bookingId);
        const open = !!current && ['PENDING', 'IN_REVIEW', 'APPROVED'].includes(current.status);
        this.flowStep = open ? 'VERIFYING' : 'PENDING';
        this.saveState();
        this.changes.markForCheck();
      },
      error: () => { /* sin payment-service se queda el estado local */ }
    });
  }

  private startQrTimer(): void {
    this.timerId = setInterval(() => {
      this.updateQrSecondsLeft();
      if (this.qrSecondsLeft() === 0) clearInterval(this.timerId);
    }, 1000);
  }

  // calcula los segundos que faltan a partir de la hora de vencimiento
  private updateQrSecondsLeft() {
    const msLeft = this.qrExpiresAt - Date.now();
    this.qrSecondsLeft.set(Math.max(0, Math.ceil(msLeft / 1000)));
  }

  // --- estado guardado del pago ---
  // el estado real (si el pago ya se reportó) lo manda loadPaymentState() desde payment-service y
  // pisa lo que haya aquí; local solo queda el cronómetro del QR y el método elegido, que no
  // tienen dónde vivir en el backend (son de la sesión, no de la reserva)
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

  async confirmPayment() {
    if (!this.canConfirm || !this.booking) return;

    // efectivo: se paga en el lavadero, no hay comprobante que reportar
    if (this.selectedMethod === 'CASH' || !this.selectedAccount || !this.receiptFile) {
      this.flowStep = 'VERIFYING';
      this.saveState();
      this.showStatusModal({ title: 'PAYMENT.SUCCESS_TITLE', message: 'PAYMENT.SUCCESS_MESSAGE' });
      return;
    }

    // el monto lo pone payment-service con el total de la reserva
    const receipt = await readImageAsDataUrl(this.receiptFile);
    this.paymentsApi.report(this.booking.id, this.selectedAccount.id, this.transactionRef, receipt).subscribe({
      next: () => {
        this.flowStep = 'VERIFYING';
        this.saveState();
        this.changes.markForCheck();
        this.showStatusModal({ title: 'PAYMENT.SUCCESS_TITLE', message: 'PAYMENT.SUCCESS_MESSAGE' });
      },
      error: (error) => {
        this.showStatusModal({ type: 'error', title: 'COMMON.ERROR', message: apiErrorKey(error) });
        this.changes.markForCheck();
      }
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
    if (!this.booking) return;

    const data: ConfirmModalData = {
      title: 'PAYMENT.CANCEL_CONFIRM.TITLE',
      message: 'PAYMENT.CANCEL_CONFIRM.MESSAGE',
      messageParams: { code: this.booking.code },
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

  // cancela de verdad en booking-service y, al cerrar el aviso, vuelve al inicio
  private onReservationCancelled() {
    if (!this.booking) return;
    const code = this.booking.code;

    this.bookingApi.cancelMyBooking(this.booking.id).subscribe({
      next: () => {
        this.clearState();
        const dialogRef = this.showStatusModal({
          title: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_TITLE',
          message: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_MESSAGE',
          messageParams: { code }
        }, true);

        dialogRef.afterClosed().subscribe(() => {
          this.router.navigate(['/client']);
        });
      },
      error: (error) => {
        this.showStatusModal({
          type: 'error',
          title: 'COMMON.ERROR',
          message: apiErrorKey(error)
        });
        this.changes.markForCheck();
      }
    });
  }


}
