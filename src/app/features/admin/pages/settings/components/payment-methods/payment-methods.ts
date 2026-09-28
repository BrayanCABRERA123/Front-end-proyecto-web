import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AddPaymentMethodData, AddPaymentMethodModal, AddPaymentMethodResult } from '../../../../../../shared/dialogs/add-payment-method-modal/add-payment-method-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { BusinessStore } from '../../../../services/business-store';
import { PaymentMethodConfig } from '../../../../models/admin.models';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss'
})
export class PaymentMethodsComponent {

  constructor(
    private store: BusinessStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  get methods(): PaymentMethodConfig[] { return this.store.paymentMethods(); }

  get activeCount(): number {
    return this.methods.filter(m => m.active).length;
  }

  // el cambio de estado pide confirmación para que nadie desactive un medio por error
  toggle(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.TOGGLE_TITLE',
      message: method.active
        ? 'PAYMENT_METHODS_SECTION.TOGGLE_OFF_MESSAGE'
        : 'PAYMENT_METHODS_SECTION.TOGGLE_ON_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.store.togglePaymentMethod(method.id);
      this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.TOGGLED_MESSAGE', {
        messageParams: { name: method.name },
      });
    });
  }

  // simula la subida de un QR (no hay backend, solo guardamos el nombre del archivo elegido)
  onQrSelected(method: PaymentMethodConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.store.updatePaymentMethod(method.id, { qrFileName: input.files[0].name });
      this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.QR_UPDATED_MESSAGE', {
        messageParams: { name: method.name },
      });
    }
  }

  openAddMethod(): void {
    const dialogRef = this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: AddPaymentMethodResult | null) => {
      if (!result) return;

      this.store.addPaymentMethod({
        name: result.name,
        type: result.type,
        holder: result.holder,
        accountNumber: result.accountNumber,
        needsQr: result.needsQr,
      });

      this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.ADDED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.ADDED_MESSAGE', {
        messageParams: { name: result.name },
      });
    });
  }

  openEditMethod(method: PaymentMethodConfig): void {
    const data: AddPaymentMethodData = {
      id: method.id,
      name: method.name,
      type: method.type,
      holder: method.holder,
      accountNumber: method.accountNumber,
      needsQr: method.needsQr,
    };

    const dialogRef = this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: AddPaymentMethodResult | null) => {
      if (!result || !result.id) return;

      this.store.updatePaymentMethod(result.id, {
        name: result.name,
        type: result.type,
        holder: result.holder,
        accountNumber: result.accountNumber,
        needsQr: result.needsQr,
      });

      this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.UPDATED_MESSAGE', {
        messageParams: { name: result.name },
      });
    });
  }

  deleteMethod(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_TITLE',
      message: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true,
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.store.removePaymentMethod(method.id);
      this.feedback.success('PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_TITLE', 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETED_MESSAGE');
    });
  }
}