import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AddPaymentMethodData, AddPaymentMethodModal, AddPaymentMethodResult } from '../../../../../../shared/dialogs/add-payment-method-modal/add-payment-method-modal';
import { ConfirmModal, ConfirmModalData } from '../../../../../../shared/dialogs/confirm-modal/confirm-modal';
import { PaymentMethodConfig } from '../../../../models/admin.models';
import { PaymentMethodsViewModel } from '../../../../viewmodels/payment-methods.viewmodel';

/**
 * Vista de las cuentas del lavadero donde el cliente paga: los datos y las acciones están en
 * PaymentMethodsViewModel; aquí quedan los modales, las confirmaciones y el selector del QR.
 */
@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  providers: [PaymentMethodsViewModel],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss'
})
export class PaymentMethodsComponent implements OnInit {

  readonly vm = inject(PaymentMethodsViewModel);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.vm.load();
  }

  // el cambio de estado pide confirmación para que nadie desactive un medio por error
  toggle(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.TOGGLE_TITLE',
      message: method.active ? 'PAYMENT_METHODS_SECTION.TOGGLE_OFF_MESSAGE' : 'PAYMENT_METHODS_SECTION.TOGGLE_ON_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.ACCEPT',
      cancelText: 'COMMON.CANCEL',
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.vm.setActive(method, !method.active);
      } else {
        this.vm.load(); // devuelve el switch a su estado real
      }
    });
  }

  // sube la imagen del QR; si el formato no sirve se limpia el selector
  async onQrSelected(method: PaymentMethodConfig, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!(await this.vm.uploadQr(method, file))) input.value = '';
  }

  openAddMethod(): void {
    this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog' }).afterClosed()
      .subscribe((result: AddPaymentMethodResult | null) => {
        if (result) this.vm.create(result);
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
    this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog', data }).afterClosed()
      .subscribe((result: AddPaymentMethodResult | null) => {
        if (result) this.vm.update(result);
      });
  }

  // las cuentas no se borran (hay pagos que las usan): se desactivan
  deleteMethod(method: PaymentMethodConfig): void {
    const data: ConfirmModalData = {
      title: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_TITLE',
      message: 'PAYMENT_METHODS_SECTION.FEEDBACK.DELETE_MESSAGE',
      messageParams: { name: method.name },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true,
    };
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.vm.remove(method);
    });
  }
}
