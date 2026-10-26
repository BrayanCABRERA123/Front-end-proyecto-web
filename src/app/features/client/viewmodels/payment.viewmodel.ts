import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

// datos reales de la reserva (booking-service)
import { BookingApiService } from '../../../core/services/booking-api';
import { BookingResponse } from '../../../core/models/booking.models';
import { isActiveStatus, isoToDisplayDate, paymentDeadlineTime, servicesLabel, vehicleLabel } from '../../../core/utils/booking-display';
import { apiErrorCode, apiErrorKey } from '../../../core/utils/api-error';
import { todayIso } from '../../../core/utils/dates';
// cuentas del lavadero y reporte del pago (payment-service)
import { ALLOWED_IMAGE_TYPES, BookingPaymentState, PaymentAccountResponse, PaymentsApiService, compressReceipt } from '../../../core/services/payments-api';
// canje de cupón de fidelización (payment-service, ADR-015)
import { LoyaltyApiService, RedeemPromotionResult } from '../../../core/services/loyalty-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

export type PaymentMethodId = 'NEQUI' | 'DAVIPLATA' | 'TRANSFER' | 'CASH';
// PENDING: falta pagar · VERIFYING: el admin lo está revisando · APPROVED: el admin lo aprobó
export type FlowStep = 'PENDING' | 'VERIFYING' | 'APPROVED';

export interface PaymentMethod {
  id: PaymentMethodId;
  // cuenta del lavadero que representa la opción (efectivo no tiene cuenta)
  accountId: number | null;
  icon: string;
  label: string;
  desc: string;
  // titular, solo cuando hay dos cuentas del mismo medio y hace falta distinguirlas
  holder?: string;
}

// lo que se guarda del pago para que no se pierda al recargar la página
interface SavedPaymentState {
  flowStep: FlowStep;
  method: PaymentMethodId;
  accountId?: number | null;
}

// efectivo: se paga en el lavadero; solo aparece si el admin tiene activa la cuenta de caja
const CASH_METHOD: PaymentMethod = { id: 'CASH', accountId: null, icon: 'payments', label: 'PAYMENT.METHOD.CASH', desc: 'PAYMENT.METHOD.CASH_DESC' };

const EMPTY_SUMMARY = { serviceName: '', vehicleModel: '', plate: '', schedule: '', subtotal: 0, pointsDiscount: 0 };

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
  return { id, accountId: account.id, icon, label: 'PAYMENT.METHOD.' + id, desc: 'PAYMENT.METHOD.' + id + '_DESC' };
}

/**
 * Pago de una reserva: elige la reserva, ofrece los medios activos del lavadero, canjea cupones,
 * prepara el comprobante y reporta el pago. El QR es la imagen fija de la cuenta del lavadero que
 * sube el admin: no es un cobro dinámico de una pasarela, así que no vence.
 */
@Injectable()
export class PaymentViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly loyaltyApi = inject(LoyaltyApiService);
  private readonly feedback = inject(FeedbackService);

  // cuentas activas del lavadero; cada medio tiene su titular, número y QR
  private readonly accounts = signal<PaymentAccountResponse[]>([]);
  private bookingId: number | null = null;

  // reserva que se está pagando
  readonly booking = signal<BookingResponse | null>(null);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly reservationCode = signal('');
  readonly serviceSummary = signal({ ...EMPTY_SUMMARY });

  // estado del pago: pendiente, en verificación o aprobado
  readonly flowStep = signal<FlowStep>('PENDING');
  // línea de soporte del lavadero (datos del negocio); vacía si booking-service no responde
  readonly supportLine = signal('');
  // motivo del último pago rechazado de esta reserva (para que el cliente sepa qué corregir)
  readonly lastRejectionReason = signal<string | null>(null);

  // medios disponibles: los que el admin tiene activos (efectivo incluido, si su cuenta está activa)
  private readonly availableMethods = signal<PaymentMethod[]>([]);
  // si el cliente eligió pago digital al reservar, no se le ofrece efectivo: solo las cuentas que
  // piden comprobante (el plazo se cumple subiéndolo). Las reservas en efectivo o antiguas (sin modo)
  // ven todos los medios activos
  readonly paymentMethods = computed(() => {
    const methods = this.availableMethods();
    if (this.booking()?.paymentMode !== 'DIGITAL') return methods;
    const accounts = this.accounts();
    return methods.filter(method => method.accountId !== null
      && accounts.find(account => account.id === method.accountId)?.requiresReceipt !== false);
  });
  private readonly accountsLoaded = signal(false);
  // payment-service no respondió: no hay medios para elegir
  readonly accountsFailed = signal(false);

  readonly selectedMethod = signal<PaymentMethodId>('CASH');
  // con dos cuentas del mismo medio (por ejemplo, dos Nequi) el medio no basta
  readonly selectedAccountId = signal<number | null>(null);

  // canje de cupón
  readonly couponCode = signal('');
  readonly couponResult = signal<RedeemPromotionResult | null>(null);
  readonly couponError = signal<string | null>(null);
  readonly redeemingCoupon = signal(false);
  // lo que falta por pagar según payment-service (BIZ-02): llega al abrir la pantalla y tras canjear o
  // quitar un cupón. La pantalla nunca lo calcula; null mientras no se sabe
  private readonly serverAmountDue = signal<number | null>(null);
  // payment-service no dijo cuánto se debe: no se muestra un total inventado
  readonly amountDueFailed = signal(false);

  // comprobante: el archivo elegido, ya comprimido (lo que se envía) y su peso real
  readonly receiptFile = signal<File | null>(null);
  private readonly receiptDataUrl = signal<string | null>(null);
  private readonly receiptBytes = signal(0);
  readonly compressingReceipt = signal(false);
  readonly transactionRef = signal('');
  // monto que el cliente pagó según su comprobante; mientras no lo cambie, se asume el total
  readonly paidAmountInput = signal<number | null>(null);
  // el reporte va en camino: el botón queda bloqueado hasta que el servidor responda
  readonly reporting = signal(false);

  readonly hasPaymentMethods = computed(() => this.accountsLoaded() && this.paymentMethods().length > 0);
  // ya se sabe que no hay medios (todos apagados o sin respuesta): se avisa en vez de ofrecer efectivo
  readonly noPaymentMethods = computed(() =>
    (this.accountsLoaded() || this.accountsFailed()) && this.paymentMethods().length === 0);

  // cuenta del medio elegido (su QR es el que se muestra)
  readonly selectedAccount = computed(() => {
    const accounts = this.accounts();
    return accounts.find(a => a.id === this.selectedAccountId())
      ?? accounts.find(a => methodIdOf(a.methodCode) === this.selectedMethod())
      ?? null;
  });

  // datos de la cuenta que recibe el pago
  readonly payee = computed(() => ({
    name: this.selectedAccount()?.accountHolder ?? '',
    key: this.selectedAccount()?.accountNumber ?? '',
    accountType: 'PAYMENT.QR.ACCOUNT_TYPE_VALUE'
  }));

  // el total es el que manda payment-service (ya resta puntos y cupón); null mientras no responde
  readonly totalToPay = computed(() => this.serverAmountDue());

  readonly isVerifying = computed(() => this.flowStep() === 'VERIFYING');
  readonly isApproved = computed(() => this.flowStep() === 'APPROVED');
  // con el pago enviado (en revisión o aprobado) ya no se puede cambiar ni volver a pagar
  readonly isLocked = computed(() => this.isVerifying() || this.isApproved());

  // pago digital con plazo y sin comprobante: "Sube el comprobante antes de las HH:mm o la reserva
  // se libera". El plazo lo pone booking-service; con el pago ya enviado desde aquí no se muestra
  readonly payBefore = computed(() => {
    const booking = this.booking();
    return booking && !this.isLocked() ? paymentDeadlineTime(booking) : null;
  });
  // el cliente eligió pagar en efectivo en el lavadero al reservar
  readonly isCashBooking = computed(() => this.booking()?.paymentMode === 'CASH' && !this.isApproved());

  readonly canRedeemCoupon = computed(() => !this.isVerifying() && !this.couponResult() && !this.redeemingCoupon()
    && this.couponCode().trim().length >= 3);

  // la referencia debe tener entre 8 y 12 caracteres alfanuméricos
  readonly isRefValid = computed(() => /^[A-Za-z0-9]{8,12}$/.test(this.transactionRef()));
  readonly paidAmount = computed(() => this.paidAmountInput() ?? this.totalToPay());
  readonly isPaidAmountValid = computed(() => {
    const amount = this.paidAmount();
    return amount !== null && Number.isFinite(amount) && amount > 0;
  });

  readonly canConfirm = computed(() => {
    // evita enviar el mismo pago dos veces (ya enviado, o con la petición en curso)
    if (this.isLocked() || this.reporting()) return false;
    // sin medios activos no se puede pagar, ni siquiera en efectivo
    if (!this.hasPaymentMethods()) return false;
    if (this.selectedMethod() === 'CASH') return true;
    return !!this.receiptDataUrl() && !this.compressingReceipt() && this.isRefValid() && this.isPaidAmountValid();
  });

  // lo que le falta al cliente para poder confirmar (se muestra debajo del botón deshabilitado)
  readonly missingRequirements = computed(() => {
    if (this.isLocked() || !this.hasPaymentMethods() || this.selectedMethod() === 'CASH') return [];
    const missing: string[] = [];
    if (!this.receiptFile()) missing.push('PAYMENT.CONFIRM.MISSING.RECEIPT');
    if (!this.isRefValid()) missing.push('PAYMENT.CONFIRM.MISSING.REFERENCE');
    if (!this.isPaidAmountValid()) missing.push('PAYMENT.CONFIRM.MISSING.AMOUNT');
    return missing;
  });

  readonly receiptSize = computed(() =>
    this.receiptFile() ? (this.receiptBytes() / (1024 * 1024)).toFixed(1) + 'MB' : '');

  /** con id se paga esa reserva; sin id, la primera activa (o la más reciente) */
  init(bookingId: number | null): void {
    this.bookingId = bookingId;
    this.loadAccounts();
    this.loadBooking();
    this.bookingApi.establishment().subscribe({
      next: business => this.supportLine.set(business.supportLine || business.phone || ''),
      error: () => undefined
    });
  }

  /**
   * Refresco automático (WEB-16): vuelve a preguntar el estado del pago y el monto, así el cliente ve
   * sin recargar cuando el admin aprueba o rechaza. Si falla, se queda lo que ya se mostraba.
   */
  refresh(): void {
    const booking = this.booking();
    if (!booking) return;
    this.loadPaymentState(booking.id);
    this.loadAmountDue(booking.id, true);
  }

  isSelected(method: PaymentMethod): boolean {
    return method.accountId === null
      ? this.selectedMethod() === 'CASH'
      : this.selectedMethod() !== 'CASH' && this.selectedAccount()?.id === method.accountId;
  }

  selectMethod(method: PaymentMethod): void {
    // con el pago en revisión o aprobado ya no se puede cambiar el método
    if (this.isLocked()) return;
    this.selectedMethod.set(method.id);
    this.selectedAccountId.set(method.accountId);
    this.saveState();
  }

  redeemCoupon(): void {
    const booking = this.booking();
    if (!this.canRedeemCoupon() || !booking) return;
    this.redeemingCoupon.set(true);
    this.couponError.set(null);
    this.loyaltyApi.redeem(booking.id, this.couponCode().trim().toUpperCase()).subscribe({
      next: result => {
        this.couponResult.set(result);
        this.serverAmountDue.set(result.newTotal);
        this.redeemingCoupon.set(false);
      },
      error: (error: unknown) => {
        this.couponError.set(apiErrorKey(error));
        this.redeemingCoupon.set(false);
        // la reserva ya tenía un cupón (por ejemplo, desde otra pestaña): se trae para poder quitarlo
        if (apiErrorCode(error) === 'PROMOTION_ONE_PER_BOOKING') this.loadAmountDue(booking.id);
      }
    });
  }

  // E-08: el canje se anula en payment-service (antes solo desaparecía de la pantalla y el descuento
  // seguía aplicado); con un pago en revisión o aprobado el servidor responde 409 y el cupón sigue
  removeCoupon(): void {
    const booking = this.booking();
    const coupon = this.couponResult();
    if (!booking || !coupon) {
      this.couponCode.set('');
      this.couponError.set(null);
      return;
    }
    if (this.redeemingCoupon()) return;
    this.redeemingCoupon.set(true);
    this.couponError.set(null);
    this.loyaltyApi.removeRedemption(booking.id, coupon.promotionId).subscribe({
      next: due => {
        this.couponResult.set(null);
        this.couponCode.set('');
        this.serverAmountDue.set(due.amountDue);
        this.redeemingCoupon.set(false);
      },
      error: (error: unknown) => {
        this.couponError.set(apiErrorKey(error));
        this.redeemingCoupon.set(false);
      }
    });
  }

  // se deja elegir hasta 10 MB; al elegirlo se comprime a máximo 2 MB y se muestra el peso real
  async setReceipt(file: File): Promise<void> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) {
      this.feedback.error('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.INVALID_FILE_MESSAGE');
      return;
    }
    this.compressingReceipt.set(true);
    try {
      const compressed = await compressReceipt(file);
      if (!compressed) {
        this.feedback.error('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.RECEIPT_TOO_LARGE');
        return;
      }
      this.receiptFile.set(file);
      this.receiptDataUrl.set(compressed.dataUrl);
      this.receiptBytes.set(compressed.size);
    } catch {
      this.feedback.error('PAYMENT.INVALID_FILE_TITLE', 'PAYMENT.INVALID_FILE_MESSAGE');
    } finally {
      this.compressingReceipt.set(false);
    }
  }

  removeReceipt(): void {
    this.receiptFile.set(null);
    this.receiptDataUrl.set(null);
    this.receiptBytes.set(0);
  }

  confirmPayment(): void {
    const booking = this.booking();
    if (!this.canConfirm() || !booking) return;

    // efectivo: se paga en el lavadero y lo registra el administrador ("Registrar pago en el
    // local"), que lo deja aprobado. Aquí no se reporta nada ni queda "en verificación"
    if (this.selectedMethod() === 'CASH') {
      this.feedback.success('PAYMENT.CASH_INFO_TITLE', 'PAYMENT.CASH_INFO_MESSAGE');
      return;
    }
    const account = this.selectedAccount();
    const receipt = this.receiptDataUrl();
    const paidAmount = this.paidAmount();
    if (!account || !receipt || paidAmount === null) return;

    // el monto a cobrar lo pone payment-service; paidAmount es lo que el cliente dice haber pagado
    this.reporting.set(true);
    this.paymentsApi.report(booking.id, account.id, this.transactionRef(), receipt, paidAmount).subscribe({
      next: () => {
        this.reporting.set(false);
        this.flowStep.set('VERIFYING');
        this.lastRejectionReason.set(null);
        this.saveState();
        this.feedback.success('PAYMENT.SUCCESS_TITLE', 'PAYMENT.SUCCESS_MESSAGE');
      },
      error: (error: unknown) => {
        this.reporting.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      }
    });
  }

  /** cancela la reserva en booking-service; la vista avisa y navega con `cancelled` */
  cancelBooking(cancelled: (code: string) => void): void {
    const booking = this.booking();
    if (!booking) return;
    this.bookingApi.cancelMyBooking(booking.id).subscribe({
      next: () => {
        this.clearState();
        cancelled(booking.code);
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // cuentas reales del lavadero (con su QR)
  private loadAccounts(): void {
    this.paymentsApi.accounts().subscribe({
      next: accounts => {
        this.accounts.set(accounts);
        const digital = accounts.map(a => methodOptionOf(a)).filter((m): m is PaymentMethod => !!m);
        for (const option of digital) {
          if (digital.filter(other => other.id === option.id).length > 1) {
            option.holder = accounts.find(a => a.id === option.accountId)?.accountHolder;
          }
        }
        const cashActive = accounts.some(a => methodIdOf(a.methodCode) === 'CASH');
        const methods = cashActive ? [...digital, CASH_METHOD] : digital;
        this.availableMethods.set(methods);
        this.accountsLoaded.set(true);
        const offered = this.paymentMethods();
        if (!this.isLocked() && offered.length > 0) {
          this.selectedMethod.set(offered[0].id);
          this.selectedAccountId.set(offered[0].accountId);
        }
        this.ensureAvailableMethod();
      },
      // sin payment-service no hay medios para elegir: se avisa y no se deja confirmar
      error: () => this.accountsFailed.set(true)
    });
  }

  // trae las reservas del cliente y elige la que se va a pagar
  private loadBooking(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      bookings: this.bookingApi.myBookings(),
      // qué reservas se pueden pagar lo decide payment-service (la misma regla del botón "Pagar"
      // del historial); con la reserva en la dirección no hace falta preguntarlo
      payable: this.bookingId
        ? of(null)
        : this.paymentsApi.myBookings().pipe(catchError(() => of(null as BookingPaymentState[] | null)))
    }).subscribe({
      next: ({ bookings, payable }) => {
        this.loading.set(false);
        const booking = this.pickBooking(bookings, payable);
        if (!booking) {
          this.notFound.set(true);
          return;
        }
        this.booking.set(booking);
        this.applyBooking(booking);
        this.loadPaymentState(booking.id);
        this.loadAmountDue(booking.id);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(apiErrorKey(error));
      }
    });
  }

  // sin reserva en la dirección (entró desde el menú): de las que se pueden pagar, la próxima cita;
  // si todas ya pasaron, la más reciente. Si payment-service no respondió, se usan las activas
  private pickBooking(bookings: BookingResponse[], payable: BookingPaymentState[] | null): BookingResponse | null {
    if (this.bookingId) {
      return bookings.find(booking => booking.id === this.bookingId) ?? null;
    }
    const payableIds = payable ? new Set(payable.filter(state => state.payable).map(state => state.bookingId)) : null;
    const candidates = bookings.filter(booking => payableIds ? payableIds.has(booking.id) : isActiveStatus(booking.status));
    const when = (booking: BookingResponse) => `${booking.date} ${booking.startTime}`;
    const now = `${todayIso()} ${new Date().toTimeString().slice(0, 5)}`;
    const upcoming = candidates.filter(booking => when(booking) >= now).sort((a, b) => when(a).localeCompare(when(b)));
    const past = candidates.filter(booking => when(booking) < now).sort((a, b) => when(b).localeCompare(when(a)));
    return upcoming[0] ?? past[0] ?? null;
  }

  private applyBooking(booking: BookingResponse): void {
    this.reservationCode.set(booking.code);
    this.serviceSummary.set({
      serviceName: servicesLabel(booking),
      vehicleModel: vehicleLabel(booking.vehicle),
      plate: booking.vehicle?.licensePlateFormatted ?? '',
      schedule: `${isoToDisplayDate(booking.date)} · ${booking.startTime} - ${booking.endTime}`,
      subtotal: booking.subtotal,
      // descuento por puntos redimidos
      pointsDiscount: booking.pointsDiscountAmount
    });
    this.restoreState();
  }

  // el estado del pago lo dice payment-service: aprobado, en revisión o sin pagar (o rechazado)
  private loadPaymentState(bookingId: number): void {
    this.paymentsApi.mine().subscribe({
      next: payments => {
        // payment-service los devuelve del más reciente al más antiguo: el primero es el vigente
        const current = payments.find(p => p.booking?.id === bookingId);
        this.flowStep.set(current?.status === 'APPROVED' ? 'APPROVED'
          : current && ['PENDING', 'IN_REVIEW'].includes(current.status) ? 'VERIFYING' : 'PENDING');
        this.lastRejectionReason.set(current?.status === 'REJECTED' ? (current.rejectionReason ?? '—') : null);
        this.saveState();
      },
      // sin payment-service se queda el estado local
      error: () => undefined
    });
  }

  // BIZ-02: monto a pagar y cupón aplicado según payment-service; así el cupón se ve (y se puede
  // quitar) aunque el cliente recargue o vuelva a entrar
  private loadAmountDue(bookingId: number, silent = false): void {
    this.loyaltyApi.bookingRedemption(bookingId).subscribe({
      next: due => {
        this.amountDueFailed.set(false);
        this.serverAmountDue.set(due.amountDue);
        const redemption = due.redemption;
        this.couponResult.set(redemption ? { ...redemption, newTotal: due.amountDue } : null);
      },
      error: () => {
        if (!silent || this.serverAmountDue() === null) this.amountDueFailed.set(true);
      }
    });
  }

  // --- estado guardado del pago ---
  // el estado real (si el pago ya se reportó) lo manda loadPaymentState() y pisa lo que haya aquí;
  // local solo queda el método elegido, que es de la sesión y no de la reserva
  private get storageKey(): string {
    return `payment-${this.reservationCode()}`;
  }

  // recupera el método elegido la última vez (si no hay nada guardado, empieza un pago nuevo)
  private restoreState(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state: SavedPaymentState = JSON.parse(saved);
        this.flowStep.set(state.flowStep);
        this.selectedMethod.set(state.method);
        this.selectedAccountId.set(state.accountId ?? null);
        this.ensureAvailableMethod();
        return;
      }
    } catch {
      // si no se puede leer, se empieza un pago nuevo
    }
    this.saveState();
  }

  private saveState(): void {
    const state: SavedPaymentState = {
      flowStep: this.flowStep(),
      method: this.selectedMethod(),
      accountId: this.selectedAccountId()
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // si el navegador no permite guardar, el estado queda solo en memoria
    }
  }

  private clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // nada que limpiar
    }
  }

  // el método guardado puede ya no estar activo (por ejemplo, el admin apagó el efectivo): se pasa
  // al primero disponible. Con el pago enviado no se toca
  private ensureAvailableMethod(): void {
    const methods = this.paymentMethods();
    if (!this.accountsLoaded() || this.isLocked() || methods.length === 0) return;
    if (methods.some(m => this.isSelected(m))) return;
    this.selectedMethod.set(methods[0].id);
    this.selectedAccountId.set(methods[0].accountId);
    this.saveState();
  }
}
