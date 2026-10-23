import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  // opcional: una lista para elegir (ej. motivo de cancelación); el modal devuelve el valor elegido
  options?: { value: string; label: string }[];
  optionsLabel?: string;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatIconModule],
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
  options: { value: string; label: string }[];
  optionsLabel: string;
  selected = '';

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
    this.options = data.options ?? [];
    this.optionsLabel = data.optionsLabel ?? '';
    this.selected = this.options[0]?.value ?? '';
  }

  // con lista de opciones, aceptar devuelve el valor elegido en lugar de true
  close(confirmed: boolean) {
    this.dialogRef.close(confirmed && this.options.length > 0 ? this.selected : confirmed);
  }
}
