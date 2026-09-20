import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { PaymentMethod } from '../../../../../../shared/dialogs/payment-review-modal/payment-review.model';

// lo que este modal devuelve cuando el admin registra el pago
export interface ManualPaymentResult {
  client: string;
  service: string;
  amount: number;
  method: PaymentMethod;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.scss'
})
export class PaymentModalComponent {

  // los mismos 4 métodos que se usan en el resto de la app (nada de tarjeta/PayPal,
  // acá se paga por QR con Nequi/Daviplata/transferencia o en efectivo)
  methods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'nequi', label: 'Nequi' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'bancolombia', label: 'Transferencia Bancolombia' },
  ];

  client = '';
  service = '';
  amount: number | null = null;
  method: PaymentMethod = 'cash';

  constructor(private dialogRef: MatDialogRef<PaymentModalComponent>) {}

  get canRegister(): boolean {
    return this.client.trim().length > 0
      && this.service.trim().length > 0
      && !!this.amount && this.amount > 0;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  register(): void {
    if (!this.canRegister) return;

    const result: ManualPaymentResult = {
      client: this.client.trim(),
      service: this.service.trim(),
      amount: this.amount ?? 0,
      method: this.method
    };

    this.dialogRef.close(result);
  }
}
