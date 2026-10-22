import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ManualPaymentResult, ManualPaymentViewModel } from '../../../../viewmodels/manual-payment.viewmodel';

// se reexporta para que la pantalla de pagos lo siga importando desde el modal
export type { ManualPaymentResult } from '../../../../viewmodels/manual-payment.viewmodel';

/** Vista del modal de pago en el local: los datos están en ManualPaymentViewModel. */
@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  providers: [ManualPaymentViewModel],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.scss'
})
export class PaymentModalComponent implements OnInit {

  readonly vm = inject(ManualPaymentViewModel);
  private readonly dialogRef = inject(MatDialogRef<PaymentModalComponent>);

  ngOnInit(): void {
    this.vm.load();
  }

  close(): void {
    this.dialogRef.close(null);
  }

  register(): void {
    const result: ManualPaymentResult | null = this.vm.result();
    if (result) this.dialogRef.close(result);
  }
}
