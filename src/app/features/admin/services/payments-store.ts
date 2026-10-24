import { Injectable, computed, inject, signal } from '@angular/core';

import { Booking, Payment, PaymentStatus } from '../models/admin.models';
import { PaymentResponse, PaymentsApiService } from '../../../core/services/payments-api';
import { AuthService } from '../../../core/services/auth';
import { ReservationsStore } from './reservations-store';

/** fecha ISO (yyyy-MM-dd) de hoy, en hora local */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** fecha legible d/m/aaaa */
export function formatPaymentDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Pagos del administrador, leídos de payment-service. La pantalla de pagos, el dashboard y los
 * reportes leen de aquí; aprobar o rechazar lo hace el backend y luego se recarga la lista.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsStore {

  private readonly api = inject(PaymentsApiService);
  private readonly auth = inject(AuthService);
  // payment-service solo trae vehículo y placa de la reserva: el cliente, la bahía y el operario
  // salen de las reservas que el admin ya tiene cargadas (mismo código de reserva)
  private readonly reservations = inject(ReservationsStore);

  private readonly state = signal<Payment[]>([]);
  private readonly source = new Map<string, PaymentResponse>();

  readonly payments = computed(() => {
    const byCode = new Map(this.reservations.bookings().map(b => [b.code, b]));
    return this.state().map(p => withBooking(p, byCode.get(p.bookingCode)));
  });
  // pagos en revisión, los más recientes primero (dashboard)
  readonly pendingPayments = computed(() => this.payments().filter(p => p.status === 'pending'));
  readonly today = todayIso();

  // hay una carga en curso: un refresco automático no pide lo mismo otra vez
  private inFlight = false;

  /**
   * Vuelve a pedir los pagos (solo tiene sentido con sesión de admin). Cada pantalla lo pide al entrar
   * y LiveRefresh lo repite (WEB-16); con `silent`, si falla, se quedan los pagos que había.
   */
  refresh(silent = false): void {
    if (!this.auth.hasAnyRole(['ADMIN'])) return;
    if (silent && this.inFlight) return;
    this.inFlight = true;
    this.api.adminList().subscribe({
      next: payments => {
        this.inFlight = false;
        this.source.clear();
        payments.forEach(p => this.source.set(String(p.id), p));
        this.state.set(payments.map(toPayment));
      },
      error: () => {
        this.inFlight = false;
        if (!silent) this.state.set([]);
      }
    });
  }

  getById(id: string): Payment | undefined {
    return this.payments().find(p => p.id === id);
  }

  /**
   * Resultado de la revisión hecha en el modal: aprobar o rechazar (lo valida el backend).
   * onDone solo se llama si payment-service aceptó el cambio, para no anunciar algo que falló.
   */
  review(id: string, status: 'approved' | 'rejected', reason?: string,
         onError?: (err: unknown) => void, onDone?: () => void): void {
    const call = status === 'approved' ? this.api.approve(Number(id)) : this.api.reject(Number(id), reason ?? '');
    call.subscribe({ next: () => { this.refresh(); onDone?.(); }, error: err => { this.refresh(); onError?.(err); } });
  }

  /** devuelve un pago aprobado; payment-service revierte los puntos de la reserva */
  refund(id: string, onDone: () => void, onError: (err: unknown) => void): void {
    this.api.refund(Number(id)).subscribe({ next: () => { this.refresh(); onDone(); }, error: err => { this.refresh(); onError(err); } });
  }

  /** imagen del comprobante del pago, para el modal de revisión */
  receiptOf(id: string): string | null {
    return this.source.get(id)?.receiptImage ?? null;
  }

  payeeOf(id: string): string {
    return this.source.get(id)?.account?.accountHolder ?? '—';
  }
}

function methodOf(code: string | undefined): Payment['method'] {
  switch (code) {
    case 'NEQUI': return 'nequi';
    case 'DAVIPLATA': return 'daviplata';
    case 'EFECTIVO': return 'cash';
    // TRANSFERENCIA: el banco no lo manda el API, así que no se adivina uno
    default: return 'transfer';
  }
}

function statusOf(code: string): PaymentStatus {
  if (code === 'APPROVED') return 'approved';
  if (code === 'REJECTED') return 'rejected';
  if (code === 'REFUNDED') return 'refunded';
  return 'pending';
}

// día local (yyyy-MM-dd) de una fecha del servidor
function localDay(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function toPayment(p: PaymentResponse): Payment {
  const reported = p.reportedAtUtc ? new Date(p.reportedAtUtc) : null;
  const date = reported
    ? `${reported.getFullYear()}-${String(reported.getMonth() + 1).padStart(2, '0')}-${String(reported.getDate()).padStart(2, '0')}`
    : (p.booking?.date ?? todayIso());
  return {
    id: String(p.id),
    code: '#PAG-' + p.id,
    client: p.booking?.plate ? `${p.booking.vehicle} - ${p.booking.plate}` : '—',
    phone: '—',
    reference: p.transactionReference ?? '—',
    method: methodOf(p.account?.methodCode),
    amount: p.amount,
    date,
    // A-17: el ingreso cuenta el día en que se aprobó, no el día en que el cliente lo reportó
    approvedDate: p.status === 'APPROVED' && p.processedAtUtc ? localDay(new Date(p.processedAtUtc)) : null,
    time: reported ? reported.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
    service: p.booking?.services ?? '—',
    status: statusOf(p.status),
    rejectionReason: p.rejectionReason ?? undefined,
    bookingCode: p.booking?.code ?? '—',
    vehicle: p.booking?.vehicle ?? '—',
    plate: p.booking?.plate ?? '—',
    scheduleLabel: p.booking ? `${formatPaymentDate(p.booking.date)} ${p.booking.startTime}` : '—',
    bay: '—',
    operator: '—',
    email: '—',
    bankAccount: p.account?.accountNumber ?? '—',
    amountDeclared: p.reportedAmount,
    cancelledBookingAction: cancelledBookingAction(p),
  };
}

// qué tiene que hacer el admin con el pago de una reserva que se canceló
function cancelledBookingAction(p: PaymentResponse): Payment['cancelledBookingAction'] {
  if (!p.bookingCancelled) return null;
  if (p.status === 'APPROVED') return 'refund';
  return p.status === 'IN_REVIEW' || p.status === 'PENDING' ? 'reject' : null;
}

/** completa el pago con los datos de su reserva; sin reserva cargada quedan los del pago */
function withBooking(p: Payment, booking: Booking | undefined): Payment {
  if (!booking) return p;
  return {
    ...p,
    client: booking.client || p.client,
    phone: booking.phone || p.phone,
    email: booking.email || p.email,
    bay: booking.bay ?? p.bay,
    operator: booking.operator?.name ?? p.operator,
  };
}
