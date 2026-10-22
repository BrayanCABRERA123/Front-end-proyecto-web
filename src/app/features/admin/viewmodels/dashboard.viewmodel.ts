import { Injectable, inject, signal } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { AvailableOperator } from '../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { PaymentReviewData } from '../../../shared/dialogs/payment-review-modal/payment-review.model';
import { ReservationsStore, formatDate, formatTimeRange } from '../services/reservations-store';
import { PaymentsStore } from '../services/payments-store';
import { paymentMethodLabel, paymentReviewData } from './payment-review';
import { Operator, OperatorsStore } from '../services/operators-store';
import { ScheduleStore } from '../services/schedule-store';
import { Booking, Payment } from '../models/admin.models';
import { apiErrorKey } from '../../../core/utils/api-error';
import { isoDay } from '../../../core/utils/dates';
import { BookingApiService } from '../../../core/services/booking-api';
import { DaySummaryResponse } from '../../../core/models/booking.models';
import { AuthService } from '../../../core/services/auth';

// un día de la gráfica de ingresos (los datos salen de los pagos aprobados)
export interface RevenueDay {
  day: string;
  amount: number;
  label: string;
  isToday: boolean;
  date: string;
}

// fila del resumen de estado de operarios
export interface OperatorStatusRow {
  initials: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'absent';
  bay: string;
}

// pago con comprobante pendiente por verificar
export interface PendingPaymentRow {
  id: string;
  client: string;
  bank: string;
  bankClass: string;
  service: string;
  reference: string;
  amount: number;
}

/** reserva con operario que terminó y nadie registró (tarjeta "Por cerrar") */
export interface ToCloseRow {
  id: string;
  code: string;
  when: string;
  client: string;
  vehicle: string;
  operator: string;
  reason: 'NOT_STARTED' | 'NOT_FINISHED';
}

// reserva confirmada que todavía no tiene operario asignado
export interface UnassignedBookingRow {
  id: string;
  time: string;
  bay: string;
  client: string;
  vehicle: string;
  service: string;
  isUpcoming: boolean;
  icon: string;
}

const SERVICE_ICONS = ['workspace_premium', 'sanitizer', 'auto_awesome', 'local_car_wash', 'spray'];

/**
 * Dashboard del admin. Lee de los stores del admin (reservas, pagos, operarios, horarios), que son
 * el estado compartido del rol; los getters se recalculan solos porque leen signals.
 */
@Injectable()
export class AdminDashboardViewModel {

  private readonly auth = inject(AuthService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly reservations = inject(ReservationsStore);
  private readonly payments = inject(PaymentsStore);
  private readonly operatorsStore = inject(OperatorsStore);
  private readonly schedule = inject(ScheduleStore);
  private readonly feedback = inject(FeedbackService);

  // reservas de hoy frente a ayer: las cuenta booking-service con la fecha del lavadero
  readonly daySummary = signal<DaySummaryResponse | null>(null);

  load(): void {
    this.bookingApi.daySummary().subscribe({ next: summary => this.daySummary.set(summary), error: () => undefined });
  }

  // primer nombre de quien inició sesión (security-service)
  get adminName(): string {
    return this.auth.user()?.firstName ?? '';
  }

  /* ---------- tarjetas resumen ---------- */

  get bookingsToday(): number {
    return this.daySummary()?.bookings ?? this.reservations.byDate(this.reservations.today).length;
  }

  // diferencia frente a ayer (puede ser negativa: ↗ o ↘); 0 mientras responde booking-service
  get vsYesterday(): number {
    return this.daySummary()?.difference ?? 0;
  }

  get vsYesterdayAbs(): number {
    return Math.abs(this.vsYesterday);
  }

  get vsDirection(): string {
    return this.vsYesterday >= 0 ? '↗' : '↘';
  }

  get servicesInProgress(): number {
    return this.reservations.byDate(this.reservations.today).filter(b => b.status === 'in_progress').length;
  }

  get activeBays(): number {
    return this.schedule.bays().filter(b => b.status === 'active').length;
  }

  get pendingPaymentsCount(): number {
    return this.payments.pendingPayments().length;
  }

  // ingresos de hoy = pagos aprobados con fecha de hoy
  get revenueToday(): number {
    return this.payments.payments()
      .filter(p => p.date === this.payments.today && p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /* ---------- gráfica de ingresos (últimos 7 días) ---------- */

  get weeklyRevenue(): RevenueDay[] {
    const payments = this.payments.payments();
    const rows: RevenueDay[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = isoDay(d);
      const amount = payments
        .filter(p => p.date === iso && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);
      rows.push({
        day: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        amount,
        label: shortAmount(amount),
        isToday: iso === this.payments.today,
        date: iso,
      });
    }
    return rows;
  }

  // día pico de la semana, calculado (no hardcodeado)
  get peakDay(): string {
    return this.weeklyRevenue.reduce((max, d) => (d.amount > max.amount ? d : max)).day;
  }

  get weekTotal(): number {
    return this.weeklyRevenue.reduce((sum, d) => sum + d.amount, 0);
  }

  get maxRevenue(): number {
    return Math.max(...this.weeklyRevenue.map(d => d.amount));
  }

  // altura de cada barra en % del máximo de la semana
  barHeight(amount: number): number {
    if (this.maxRevenue === 0) return 0;
    return Math.max(4, Math.round((amount / this.maxRevenue) * 100));
  }

  /* ---------- operarios ---------- */

  get operators(): OperatorStatusRow[] {
    return this.operatorsStore.operators().slice(0, 5).map((o: Operator) => ({
      initials: o.initials,
      name: o.name,
      role: o.specialty,
      status: o.status === 'in_service' ? 'busy' : o.status === 'medical_leave' ? 'absent' : 'available',
      bay: o.bay ?? '',
    }));
  }

  countByStatus(status: OperatorStatusRow['status']): number {
    return this.operators.filter(o => o.status === status).length;
  }

  /* ---------- pagos pendientes ---------- */

  get pendingPayments(): PendingPaymentRow[] {
    return this.payments.pendingPayments().slice(0, 3).map(p => ({
      id: p.id,
      client: p.client,
      bank: paymentMethodLabel(p.method),
      bankClass: p.method,
      service: p.service,
      reference: p.reference,
      amount: p.amount,
    }));
  }

  methodLabel(method: Payment['method']): string {
    return paymentMethodLabel(method);
  }

  // lo que muestra el modal de revisión de un pago
  reviewData(paymentId: string): PaymentReviewData | null {
    const payment = this.payments.getById(paymentId);
    return payment ? paymentReviewData(payment, this.payments) : null;
  }

  // el aviso de éxito sale solo cuando payment-service aceptó la decisión
  reviewPayment(paymentId: string, code: string, action: 'approved' | 'rejected', reason?: string): void {
    this.payments.review(paymentId, action, reason,
      err => this.feedback.error('COMMON.ERROR', apiErrorKey(err)),
      () => this.feedback.success('ADMIN_PAYMENTS.FEEDBACK.REVIEWED_TITLE', 'ADMIN_PAYMENTS.FEEDBACK.REVIEWED_MESSAGE', {
        messageParams: { code },
        details: reason ? [{ label: 'PAYMENT_REVIEW_MODAL.REJECT_REASON_LABEL', value: reason }] : [],
      }));
  }

  /* ---------- por cerrar: terminaron con operario y nadie las registró ---------- */

  get toCloseRows(): ToCloseRow[] {
    return this.reservations.toClose().map(({ booking, reason }) => ({
      id: booking.id,
      code: booking.code,
      when: `${formatDate(booking.date)} · ${formatTimeRange(booking.time, booking.durationMin)}`,
      client: booking.client,
      vehicle: booking.vehicle,
      operator: booking.operator?.name ?? '—',
      reason,
    }));
  }

  // "Se atendió": queda completada con su operario (cuenta en reportes y en sus servicios)
  closeAsAttended(row: ToCloseRow): void {
    this.reservations.closeAsAttended(row.id).subscribe({
      next: () => this.feedback.success('ADMIN_DASHBOARD.TO_CLOSE.TITLE', 'ADMIN_DASHBOARD.TO_CLOSE.ATTENDED_DONE',
        { messageParams: { code: row.code } }),
      error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // "No asistió": solo si nunca se inició
  markNoShow(row: ToCloseRow): void {
    this.reservations.setStatus(row.id, 'no_show').subscribe({
      next: () => this.feedback.success('ADMIN_DASHBOARD.TO_CLOSE.TITLE', 'ADMIN_DASHBOARD.TO_CLOSE.NO_SHOW_DONE',
        { messageParams: { code: row.code } }),
      error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  /* ---------- reservas sin operario ---------- */

  /** cuántas reservas necesitan operario (la misma cuenta que la pantalla de reservas) */
  get unassignedCount(): number {
    return this.reservations.unassigned().length;
  }

  // las tres más próximas que necesitan operario
  get unassignedBookings(): UnassignedBookingRow[] {
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return this.reservations.unassigned().slice(0, 3).map((b, i) => ({
      id: b.id,
      time: formatTimeRange(b.time, b.durationMin),
      bay: b.bay ?? '—',
      client: b.client,
      vehicle: b.vehicle,
      service: b.service,
      isUpcoming: b.date === this.reservations.today && b.time >= now,
      icon: SERVICE_ICONS[i % SERVICE_ICONS.length],
    }));
  }

  // quién está disponible para esa reserva (operations-service); la vista abre el modal con ellos
  loadCandidates(bookingId: string, ready: (booking: Booking, operators: AvailableOperator[]) => void): void {
    const booking = this.reservations.getById(bookingId);
    if (!booking) return;
    this.operatorsStore.candidatesFor(booking.id).subscribe({
      next: operators => ready(booking, operators),
      error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // el aviso de éxito sale solo si el backend aceptó la asignación
  assignOperator(booking: Booking, operatorId: string): void {
    this.reservations.assignOperator(booking.id, operatorId, () =>
      this.feedback.success('ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_TITLE', 'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_MESSAGE',
        { messageParams: { code: booking.code } }));
  }
}

function shortAmount(amount: number): string {
  if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (amount >= 1_000) return '$' + Math.round(amount / 1_000) + 'k';
  return '$' + amount;
}
