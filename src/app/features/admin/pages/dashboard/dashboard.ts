import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AvailableOperator, AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentReviewData, PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';
import { ReservationsStore, formatTimeRange } from '../../services/reservations-store';
import { PaymentsStore, formatPaymentDate } from '../../services/payments-store';
import { Operator, OperatorsStore } from '../../services/operators-store';
import { ScheduleStore } from '../../services/schedule-store';
import { Booking, Payment } from '../../models/admin.models';
import { apiErrorKey } from '../../../../core/utils/api-error';

// un día de la gráfica de ingresos (los datos salen de los pagos aprobados)
interface RevenueDay {
  day: string;
  amount: number;
  label: string;
  isToday: boolean;
  date: string;
}

// fila del resumen de estado de operarios
interface OperatorStatusRow {
  initials: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'absent';
  bay: string;
}

// pago con comprobante pendiente por verificar
interface PendingPaymentRow {
  id: string;
  client: string;
  bank: string;
  bankClass: string;
  service: string;
  reference: string;
  amount: number;
}

// reserva confirmada que todavía no tiene operario asignado
interface UnassignedBookingRow {
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {

  adminName = 'Laura';

  today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  constructor(
    private router: Router,
    private reservations: ReservationsStore,
    private payments: PaymentsStore,
    private operatorsStore: OperatorsStore,
    private schedule: ScheduleStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  /* ---------- tarjetas resumen ---------- */

  get bookingsToday(): number {
    return this.reservations.byDate(this.reservations.today).length;
  }

  get bookingsYesterday(): number {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.reservations.byDate(yesterday.toISOString().slice(0, 10)).length;
  }

  // diferencia frente a ayer (puede ser negativa: ↗ o ↘)
  get vsYesterday(): number {
    return this.bookingsToday - this.bookingsYesterday;
  }

  get vsYesterdayAbs(): number {
    return Math.abs(this.vsYesterday);
  }

  get vsDirection(): string {
    return this.vsYesterday >= 0 ? '↗' : '↘';
  }

  get servicesInProgress(): number {
    return this.reservations.byDate(this.reservations.today)
      .filter(b => b.status === 'in_progress').length;
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
      const iso = d.toISOString().slice(0, 10);

      const amount = payments
        .filter(p => p.date === iso && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);

      rows.push({
        day: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        amount,
        label: this.shortAmount(amount),
        isToday: iso === this.payments.today,
        date: iso,
      });
    }

    return rows;
  }

  // día pico de la semana, calculado (no hardcodeado)
  get peakDay(): string {
    const peak = this.weeklyRevenue.reduce((max, d) => (d.amount > max.amount ? d : max));
    return peak.day;
  }

  private shortAmount(amount: number): string {
    if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (amount >= 1_000) return '$' + Math.round(amount / 1_000) + 'k';
    return '$' + amount;
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

  // formatea a pesos colombianos, ej: $680.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
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
      bank: this.methodLabel(p.method),
      bankClass: p.method,
      service: p.service,
      reference: p.reference,
      amount: p.amount,
    }));
  }

  // nombre comercial de cada método de pago
  methodLabel(method: Payment['method']): string {
    const labels: Record<Payment['method'], string> = {
      nequi: 'Nequi',
      daviplata: 'Daviplata',
      bancolombia: 'Bancolombia',
      cash: 'Efectivo',
    };
    return labels[method] ?? method;
  }

  /* ---------- reservas sin operario ---------- */

  get unassignedBookings(): UnassignedBookingRow[] {
    return this.reservations.bookings()
      .filter(b => b.status === 'confirmed' && !b.operator && b.date >= this.reservations.today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 3)
      .map((b, i) => ({
        id: b.id,
        time: formatTimeRange(b.time, b.durationMin),
        bay: b.bay ?? '—',
        client: b.client,
        vehicle: b.vehicle,
        service: b.service,
        isUpcoming: b.date === this.reservations.today && b.time >= new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        icon: SERVICE_ICONS[i % SERVICE_ICONS.length],
      }));
  }

  /* ---------- navegación ---------- */

  goToReservations(): void {
    this.router.navigate(['/admin/reservations']);
  }

  goToPayments(): void {
    this.router.navigate(['/admin/payments']);
  }

  goToReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  goToOperators(): void {
    this.router.navigate(['/admin/operators']);
  }

  /* ---------- acciones ---------- */

  // revisar un pago pendiente desde la tarjeta (mismo flujo que la pantalla de pagos)
  reviewPayment(row: PendingPaymentRow): void {
    const payment = this.payments.getById(row.id);
    if (!payment) return;

    const data: PaymentReviewData = {
      code: payment.code,
      status: payment.status,
      client: payment.client,
      phone: payment.phone,
      email: payment.email,
      bookingCode: payment.bookingCode,
      service: payment.service,
      vehicle: payment.vehicle,
      plate: payment.plate,
      scheduleLabel: payment.scheduleLabel,
      bay: payment.bay,
      operator: payment.operator,
      method: payment.method,
      transactionReference: payment.reference,
      amountDue: payment.amount,
      amountDeclared: payment.amountDeclared,
      receiptDate: `${formatPaymentDate(payment.date)}, ${payment.time} COT`,
      bankAccount: payment.bankAccount,
      rejectionReason: payment.rejectionReason,
    };

    const dialogRef = this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PaymentReviewResult | null) => {
      if (!result || !result.action) return;

      this.payments.review(payment.id, result.action, result.reason);
      this.feedback.success(
        'ADMIN_PAYMENTS.FEEDBACK.REVIEWED_TITLE',
        'ADMIN_PAYMENTS.FEEDBACK.REVIEWED_MESSAGE',
        {
          messageParams: { code: payment.code },
          details: result.reason
            ? [{ label: 'PAYMENT_REVIEW_MODAL.REJECT_REASON_LABEL', value: result.reason }]
            : [],
        }
      );
    });
  }

  // asignar un operario a una reserva sin asignar (mismo flujo que reservas)
  assignOperator(bookingId: string): void {
    const booking = this.reservations.getById(bookingId);
    if (!booking) return;
    // primero pide a operations quién está disponible para esa reserva y luego abre el modal
    this.operatorsStore.candidatesFor(booking.id).subscribe({
      next: operators => this.showAssignModal(booking, operators),
      error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  private showAssignModal(booking: Booking, operators: AvailableOperator[]): void {
    const modalData: AssignOperatorModalData = {
      bookingCode: booking.code,
      client: booking.client,
      vehicle: booking.vehicle,
      plate: booking.plate,
      service: booking.service,
      timeLabel: formatTimeRange(booking.time, booking.durationMin),
      bay: booking.bay ?? '—',
      operators,
    };

    const dialogRef = this.dialog.open(AssignOperatorModal, {
      panelClass: 'custom-dialog',
      data: modalData
    });

    dialogRef.afterClosed().subscribe((result: AssignOperatorResult | null) => {
      if (!result) return;
      // el aviso de éxito sale solo si el backend aceptó la asignación
      this.reservations.assignOperator(booking.id, result.operatorId, () =>
        this.feedback.success(
          'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_TITLE',
          'ADMIN_RESERVATIONS.FEEDBACK.ASSIGNED_MESSAGE',
          { messageParams: { code: booking.code } }
        )
      );
    });
  }

}