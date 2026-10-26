import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { AssignOperatorModal } from '../../../../shared/dialogs/assign-operator-modal/assign-operator-modal';
import { AvailableOperator, AssignOperatorModalData, AssignOperatorResult } from '../../../../shared/dialogs/assign-operator-modal/assign-operator.model';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';
import { formatTimeRange } from '../../services/reservations-store';
import { Booking } from '../../models/admin.models';
import { LongDatePipe } from '../../../../shared/pipes/long-date.pipe';
import { AdminDashboardViewModel, PendingPaymentRow, ToCloseRow } from '../../viewmodels/dashboard.viewmodel';
import { WAITING_POLL_MS, keepFresh } from '../../../../core/services/live-refresh';

// vista del dashboard del admin: los datos y las acciones están en AdminDashboardViewModel
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent, LongDatePipe],
  providers: [AdminDashboardViewModel],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {

  readonly vm = inject(AdminDashboardViewModel);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña, con cada notificación
  // nueva y cada tanto mientras la pestaña esté visible, porque esta vista espera a otras personas
  constructor() {
    keepFresh(silent => this.vm.load(silent), { pollMs: WAITING_POLL_MS });
  }

  readonly today = new Date();

  // formatea a pesos colombianos, ej: $680.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
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

  /* ---------- por cerrar ---------- */

  closeAsAttended(row: ToCloseRow): void {
    this.confirmThen('ADMIN_DASHBOARD.TO_CLOSE.ATTENDED_CONFIRM', row, false, () => this.vm.closeAsAttended(row));
  }

  markNoShow(row: ToCloseRow): void {
    this.confirmThen('ADMIN_DASHBOARD.TO_CLOSE.NO_SHOW_CONFIRM', row, true, () => this.vm.markNoShow(row));
  }

  private confirmThen(message: string, row: ToCloseRow, danger: boolean, action: () => void): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_DASHBOARD.TO_CLOSE.TITLE',
      message,
      messageParams: { code: row.code, operator: row.operator },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
      danger,
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed()
      .subscribe(confirmed => { if (confirmed) action(); });
  }

  /* ---------- acciones ---------- */

  // revisar un pago pendiente desde la tarjeta (mismo flujo que la pantalla de pagos)
  reviewPayment(row: PendingPaymentRow): void {
    const data = this.vm.reviewData(row.id);
    if (!data) return;

    this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: PaymentReviewResult | null) => {
        // desde el dashboard solo llegan pagos pendientes: aprobar o rechazar
        if (!result || (result.action !== 'approved' && result.action !== 'rejected')) return;
        this.vm.reviewPayment(row.id, data.code, result.action, result.reason);
      });
  }

  // asignar un operario a una reserva sin asignar (mismo flujo que reservas)
  assignOperator(bookingId: string): void {
    this.vm.loadCandidates(bookingId, (booking, operators) => this.showAssignModal(booking, operators));
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

    this.dialog.open(AssignOperatorModal, { panelClass: 'custom-dialog', data: modalData })
      .afterClosed()
      .subscribe((result: AssignOperatorResult | null) => {
        if (result) this.vm.assignOperator(booking, result.operatorId, result.notes);
      });
  }
}
