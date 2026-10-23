import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface ConfirmModalData {
  title: string;
  message: string;
  // valores opcionales para interpolar en el mensaje (ej. {{ plate }})
  messageParams?: Record<string, string>;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss'
})
export class ConfirmModal {

  title: string;
  message: string;
  messageParams: Record<string, string>;
  confirmText: string;
  cancelText: string;
  danger: boolean;

  constructor(
    private dialogRef: MatDialogRef<ConfirmModal>,
    @Inject(MAT_DIALOG_DATA) private data: ConfirmModalData
  ) {
    this.title = data.title;
    this.message = data.message;
    this.messageParams = data.messageParams ?? {};
    this.confirmText = data.confirmText ?? 'COMMON.DELETE';
    this.cancelText = data.cancelText ?? 'COMMON.CANCEL';
    this.danger = data.danger ?? true;
  }

  close(confirmed: boolean) {
    this.dialogRef.close(confirmed);
  }
}
