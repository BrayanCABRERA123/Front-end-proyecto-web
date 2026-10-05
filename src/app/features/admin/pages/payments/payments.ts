import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { PaymentModalComponent, ManualPaymentResult } from './components/payment-modal/payment-modal';
import { PaymentsApiService } from '../../../../core/services/payments-api';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentReviewData, PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { PaymentsStore, formatPaymentDate } from '../../services/payments-store';
import { Payment, PaymentStatus } from '../../models/admin.models';
import { apiErrorKey } from '../../../../core/utils/api-error';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, TranslateModule, EmptyStateComponent],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent implements OnInit {

  search = '';
  methodFilter = '';
  statusFilter: PaymentStatus | '' = '';

  constructor(
    private store: PaymentsStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
    private paymentsApi: PaymentsApiService,
  ) {}

  // pagos reales de payment-service
  ngOnInit(): void {
    this.store.refresh();
  }

  get payments(): Payment[] { return this.store.payments(); }

  get filteredPayments(): Payment[] {
    const term = this.search.trim().toLowerCase();

    return this.payments
      .filter(p => !this.methodFilter || p.method === this.methodFilter)
      .filter(p => !this.statusFilter || p.status === this.statusFilter)
      .filter(p => !term
        || p.client.toLowerCase().includes(term)
        || p.reference.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term));
  }

  get hasActiveFilters(): boolean {
    return !!this.search || !!this.methodFilter || !!this.statusFilter;
  }

  get stats() {
    const approvedToday = this.payments.filter(p => p.status === 'approved' && p.date === this.store.today);

    return {
      pending: this.payments.filter(p => p.status === 'pending').length,
      approvedToday: approvedToday.length,
      approvedAmount: approvedToday.reduce((sum, p) => sum + p.amount, 0),
      rejected: this.payments.filter(p => p.status === 'rejected').length,
      totalCollected: approvedToday.reduce((sum, p) => sum + p.amount, 0),
      transactionsCount: this.payments.length,
    };
  }

  clearFilters(): void {
    this.search = '';
    this.methodFilter = '';
    this.statusFilter = '';
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // fecha ISO -> d/m/aaaa para la tabla
  fmtDate(iso: string): string {
    return formatPaymentDate(iso);
  }

  methodLabel(method: Payment['method']): string {
    const labels: Record<Payment['method'], string> = {
      nequi: 'Nequi',
      daviplata: 'Daviplata',
      bancolombia: 'Bancolombia',
      cash: 'Efectivo',
    };
    return labels[method] ?? method;
  }

  // --- registro manual: pago recibido en el lavadero para una reserva real ---

  openManualModal(): void {
    this.dialog.open(PaymentModalComponent, { panelClass: 'custom-dialog' }).afterClosed()
      .subscribe((result: ManualPaymentResult | null) => {
        if (!result) return;
        this.paymentsApi.registerManual(result.bookingId, result.paymentAccountId).subscribe({
          next: created => {
            this.store.refresh();
            this.feedback.success('ADMIN_PAYMENTS.FEEDBACK.MANUAL_TITLE', 'ADMIN_PAYMENTS.FEEDBACK.MANUAL_MESSAGE',
              { messageParams: { code: '#PAG-' + created.id, client: created.booking?.code ?? '' } });
          },
          error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
        });
      });
  }

  // --- revisión de pago pendiente / recibo / motivo de rechazo ---

  openReview(payment: Payment): void {
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
      receiptImage: this.store.receiptOf(payment.id),
      payee: this.store.payeeOf(payment.id),
    };

    const dialogRef = this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PaymentReviewResult | null) => {
      if (!result || !result.action) return;

      this.store.review(payment.id, result.action, result.reason,
        err => this.feedback.error('COMMON.ERROR', apiErrorKey(err)));
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

  // un pago rechazado se explica en un modal de estado con el motivo
  viewRejectionReason(payment: Payment): void {
    this.feedback.info(
      'ADMIN_PAYMENTS.FEEDBACK.REJECTED_TITLE',
      'ADMIN_PAYMENTS.FEEDBACK.REJECTED_MESSAGE',
      {
        messageParams: { code: payment.code },
        details: [
          { label: 'PAYMENT_REVIEW_MODAL.REJECT_REASON_LABEL', value: payment.rejectionReason ?? '—' },
        ],
      }
    );
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

    const rows = this.filteredPayments.map(p => ({
      code: p.code,
      client: p.client,
      method: this.methodLabel(p.method),
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