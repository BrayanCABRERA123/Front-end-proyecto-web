import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AddPaymentMethodModal, AddPaymentMethodResult } from '../../../../../../shared/dialogs/add-payment-method-modal/add-payment-method-modal';

interface PaymentMethodConfig {
  id: string;
  name: string;
  type: string;
  holder: string;
  accountNumber: string;
  active: boolean;
  needsQr: boolean;
  qrFileName?: string;
}

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss'
})
export class PaymentMethodsComponent {

  methods: PaymentMethodConfig[] = [
    { id: 'nequi', name: 'Nequi Colombia', type: 'Billetera digital', holder: 'Express Car Wash S.A.S.', accountNumber: '312 490 8821', active: true, needsQr: true, qrFileName: 'qr_nequi_oficial.png' },
    { id: 'daviplata', name: 'Daviplata', type: 'Davivienda', holder: 'Express Car Wash S.A.S.', accountNumber: '312 490 8821', active: true, needsQr: true, qrFileName: 'qr_daviplata.png' },
    { id: 'bancolombia', name: 'Transferencia Bancaria Bancolombia', type: 'Cta. ahorros', holder: 'Express Car Wash S.A.S. (NIT 901.482.930-1)', accountNumber: '241-009821-45', active: true, needsQr: true },
    { id: 'cash', name: 'Efectivo en caja', type: 'Presencial', holder: 'Pago en caja física al momento de retirar el vehículo', accountNumber: '', active: true, needsQr: false },
  ];

  constructor(private dialog: MatDialog) {}

  get activeCount(): number {
    return this.methods.filter(m => m.active).length;
  }

  toggle(method: PaymentMethodConfig): void {
    method.active = !method.active;
  }

  // simula la subida de un QR (no hay backend, solo guardamos el nombre del archivo elegido)
  onQrSelected(method: PaymentMethodConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      method.qrFileName = input.files[0].name;
    }
  }

  openAddMethod(): void {
    const dialogRef = this.dialog.open(AddPaymentMethodModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: AddPaymentMethodResult | null) => {
      if (!result) return;

      this.methods = [
        ...this.methods,
        {
          id: 'method-' + (this.methods.length + 1),
          name: result.name,
          type: result.type,
          holder: result.holder,
          accountNumber: result.accountNumber,
          active: true,
          needsQr: true
        }
      ];
    });
  }
}
