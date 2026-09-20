import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { PaymentReviewData, PaymentReviewResult } from './payment-review.model';

@Component({
  selector: 'app-payment-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './payment-review-modal.html',
  styleUrl: './payment-review-modal.scss'
})
export class PaymentReviewModal {

  // true cuando el admin le dio "Rechazar" y ahora toca pedirle el motivo
  askingRejectReason = false;
  rejectReason = '';

  constructor(
    private dialogRef: MatDialogRef<PaymentReviewModal>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentReviewData
  ) {}

  get amountsMatch(): boolean {
    return this.data.amountDue === this.data.amountDeclared;
  }

  get differencePercent(): number {
    if (this.data.amountDue === 0) return 0;
    const diff = Math.abs(this.data.amountDue - this.data.amountDeclared);
    return Math.round((diff / this.data.amountDue) * 100);
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  close(): void {
    this.dialogRef.close(null);
  }

  approve(): void {
    const result: PaymentReviewResult = { action: 'approved' };
    this.dialogRef.close(result);
  }

  startReject(): void {
    this.askingRejectReason = true;
  }

  confirmReject(): void {
    if (!this.rejectReason.trim()) return;

    const result: PaymentReviewResult = { action: 'rejected', reason: this.rejectReason.trim() };
    this.dialogRef.close(result);
  }
}
