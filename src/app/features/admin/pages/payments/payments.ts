import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { PaymentModalComponent, ManualPaymentResult } from './components/payment-modal/payment-modal';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { formatPaymentDate } from '../../services/payments-store';
import { Payment } from '../../models/admin.models';
import { PaymentsViewModel } from '../../viewmodels/payments.viewmodel';
import { WAITING_POLL_MS, keepFresh } from '../../../../core/services/live-refresh';

// vista de Pagos del admin: filtros y acciones están en PaymentsViewModel; aquí quedan los
// modales, la confirmación del reembolso y la exportación
@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, TranslateModule, EmptyStateComponent],
  providers: [PaymentsViewModel],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent {

  readonly vm = inject(PaymentsViewModel);
  private readonly dialog = inject(MatDialog);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña, con cada notificación
  // nueva y cada tanto mientras la pestaña esté visible, porque esta vista espera a otras personas
  constructor() {
    keepFresh(silent => this.vm.load(silent), { pollMs: WAITING_POLL_MS });
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // fecha ISO -> d/m/aaaa para la tabla
  fmtDate(iso: string): string {
    return formatPaymentDate(iso);
  }

  // --- registro manual: pago recibido en el lavadero para una reserva real ---
  openManualModal(): void {
    this.dialog.open(PaymentModalComponent, { panelClass: 'custom-dialog' }).afterClosed()
      .subscribe((result: ManualPaymentResult | null) => {
        if (result) this.vm.registerManual(result);
      });
  }

  // --- revisión de pago pendiente / recibo / motivo de rechazo ---
  openReview(payment: Payment): void {
    this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data: this.vm.reviewData(payment) })
      .afterClosed()
      .subscribe((result: PaymentReviewResult | null) => {
        if (!result || !result.action) return;
        if (result.action === 'refunded') {
          this.confirmRefund(payment);
          return;
        }
        this.vm.review(payment, result.action, result.reason);
      });
  }

  // reembolsar es irreversible (revierte los puntos de la reserva): se confirma antes
  confirmRefund(payment: Payment): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_PAYMENTS.REFUND.CONFIRM_TITLE',
      message: 'ADMIN_PAYMENTS.REFUND.CONFIRM_MESSAGE',
      messageParams: { code: payment.code },
      confirmText: 'ADMIN_PAYMENTS.REFUND.CONFIRM',
      cancelText: 'COMMON.CANCEL',
      danger: true
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.vm.refund(payment);
      });
  }

  viewRejectionReason(payment: Payment): void {
    this.vm.showRejectionReason(payment);
  }

  // exporta la conciliación con los filtros aplicados
  exportData(): void {
    const columns: ExportColumn[] = [
      { key: 'code', labelKey: 'ADMIN_PAYMENTS.TABLE.REFERENCE' },
      { key: 'client', labelKey: 'ADMIN_PAYMENTS.TABLE.CLIENT' },
      { key: 'method', labelKey: 'ADMIN_PAYMENTS.TABLE.METHOD' },
      { key: 'amount', labelKey: 'ADMIN_PAYMENTS.TABLE.AMOUNT' },
      { key: 'date', labelKey: 'ADMIN_PAYMENTS.TABLE.DATE_TIME' },
      { key: 'service', labelKey: 'PAYMENT_REVIEW_MODAL.SERVICE_VEHICLE' },
      { key: 'status', labelKey: 'ADMIN_PAYMENTS.TABLE.STATUS' },
    ];

    const rows = this.vm.filteredPayments.map(p => ({
      code: p.code,
      client: p.client,
      method: this.vm.methodLabel(p.method),
      amount: this.cop(p.amount),
      date: `${formatPaymentDate(p.date)}, ${p.time}`,
      service: p.service,
      status: p.status,
    }));

    const data: ExportDataModalData = {
      titleKey: 'ADMIN_PAYMENTS.TITLE',
      fileName: 'conciliacion-pagos',
      documentTitle: 'Conciliación de pagos',
      columns,
      rows,
    };

    this.dialog.open(ExportDataModal, { panelClass: 'custom-dialog', data });
  }
}
