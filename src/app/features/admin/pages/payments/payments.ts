import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { PaymentModalComponent } from './components/payment-modal/payment-modal';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentReviewData, PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';
import { AdminPayment, AdminPaymentsService } from '../../../../core/services/admin-payments';
import { Auth } from '../../../../core/services/auth';

type PaymentStatus = 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent implements OnInit {

  search = '';
  methodFilter = '';
  statusFilter: PaymentStatus | '' = '';

  // pagos reportados por los clientes + registrados en sede (GET /admin/payments)
  payments: AdminPayment[] = [];

  // contadores calculados por el mock API
  stats = { pending: 0, approvedToday: 0, approvedAmount: 0, rejected: 0, totalCollected: 0, transactionsCount: 0 };

  // mensaje del mock API (pago ya revisado, etc.)
  errorMessage: string | null = null;

  constructor(
    private dialog: MatDialog,
    private adminPayments: AdminPaymentsService,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.adminPayments.list$().subscribe(overview => {
      this.payments = overview.items;
      this.stats = overview.stats;
    });
  }

  get filteredPayments(): AdminPayment[] {
    const term = this.search.trim().toLowerCase();

    return this.payments
      .filter(p => !this.methodFilter || p.method === this.methodFilter)
      .filter(p => !this.statusFilter || p.status === this.statusFilter)
      .filter(p => !term
        || p.client.toLowerCase().includes(term)
        || p.reference.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term)
        || p.bookingCode.toLowerCase().includes(term));
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

  // --- registro manual (pago recibido en sede) ---

  openManualModal(): void {
    const dialogRef = this.dialog.open(PaymentModalComponent, { panelClass: 'custom-dialog' });

    // el modal registra el pago en el mock y devuelve true si se guardó
    dialogRef.afterClosed().subscribe((saved: boolean) => {
      if (saved) this.load();
    });
  }

  // --- revisión de pago pendiente ---

  openReview(payment: AdminPayment): void {
    const data: PaymentReviewData = {
      ...payment,
      transactionReference: payment.reference,
      amountDue: payment.amount,
      receiptDate: `${payment.date}, ${payment.time} COT`,
      auditedBy: this.auth.getCurrentUser()?.nombre
    };

    const dialogRef = this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PaymentReviewResult | null) => {
      if (!result) return;

      this.errorMessage = null;
      this.adminPayments.review$(payment.id, result.action, result.reason).subscribe({
        next: () => this.load(),
        error: (err: HttpErrorResponse) => (this.errorMessage = err.error?.message ?? 'Error')
      });
    });
  }

  // el motivo de rechazo se muestra en el mismo modal, en modo lectura
  viewRejectionReason(payment: AdminPayment): void {
    this.openReview(payment);
  }
}
