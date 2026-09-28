import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// si llegan datos, el modal está en modo edición
export interface AddPaymentMethodData {
  id?: string;
  name: string;
  type: string;
  holder: string;
  accountNumber: string;
  needsQr: boolean;
}

export interface AddPaymentMethodResult {
  id?: string;
  name: string;
  type: string;
  holder: string;
  accountNumber: string;
  needsQr: boolean;
}

@Component({
  selector: 'app-add-payment-method-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './add-payment-method-modal.html',
  styleUrl: './add-payment-method-modal.scss'
})
export class AddPaymentMethodModal {

  name = '';
  type = '';
  holder = '';
  accountNumber = '';
  needsQr = true;

  editing = false;
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<AddPaymentMethodModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: AddPaymentMethodData | null,
  ) {
    if (data) {
      this.editing = true;
      this.name = data.name;
      this.type = data.type;
      this.holder = data.holder;
      this.accountNumber = data.accountNumber;
      this.needsQr = data.needsQr;
    }
  }

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 2;
  }

  get accountInvalid(): boolean {
    return this.submitted && this.accountNumber.trim().length < 4;
  }

  get canSave(): boolean {
    return this.name.trim().length >= 2 && this.accountNumber.trim().length >= 4;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const result: AddPaymentMethodResult = {
      id: this.data?.id,
      name: this.name.trim(),
      type: this.type.trim(),
      holder: this.holder.trim(),
      accountNumber: this.accountNumber.trim(),
      needsQr: this.needsQr
    };

    this.dialogRef.close(result);
  }
}