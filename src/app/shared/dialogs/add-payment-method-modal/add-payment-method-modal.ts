import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface AddPaymentMethodResult {
  name: string;
  type: string;
  holder: string;
  accountNumber: string;
}

@Component({
  selector: 'app-add-payment-method-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './add-payment-method-modal.html',
  styleUrl: './add-payment-method-modal.scss'
})
export class AddPaymentMethodModal {

  name = '';
  type = '';
  holder = '';
  accountNumber = '';

  constructor(private dialogRef: MatDialogRef<AddPaymentMethodModal>) {}

  get canSave(): boolean {
    return this.name.trim().length > 0 && this.accountNumber.trim().length > 0;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave) return;

    const result: AddPaymentMethodResult = {
      name: this.name.trim(),
      type: this.type.trim(),
      holder: this.holder.trim(),
      accountNumber: this.accountNumber.trim()
    };

    this.dialogRef.close(result);
  }
}
