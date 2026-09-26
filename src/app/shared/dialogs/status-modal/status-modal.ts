import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


// tipos de estado que puede mostrar el modal
export type StatusModalType = 'success' | 'error';

// datos que recibe el modal (se pasan como llaves de traducción)
export interface StatusModalData {
  title: string;
  message: string;
  buttonText?: string;
  type?: StatusModalType;
}

// modal reutilizable para mostrar un mensaje de estado (éxito o error)
@Component({
  selector: 'app-status-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './status-modal.html',
  styleUrl: './status-modal.scss'
})
export class StatusModal {

  title: string;
  message: string;
  buttonText: string;
  type: StatusModalType;

  constructor(
    private dialogRef: MatDialogRef<StatusModal>,
    @Inject(MAT_DIALOG_DATA) private data: StatusModalData
  ) {
    this.title = data.title;
    this.message = data.message;
    // si no se envía texto para el botón, usamos "Aceptar" por defecto
    this.buttonText = data.buttonText ?? 'COMMON.ACCEPT';
    // si no se envía el tipo, el modal es de éxito por defecto
    this.type = data.type ?? 'success';
  }

  // ícono de Material según el tipo de estado
  get icon(): string {
    return this.type === 'error' ? 'error' : 'check_circle';
  }

  // cierra el modal
  close() {
    this.dialogRef.close(true);
  }
}
