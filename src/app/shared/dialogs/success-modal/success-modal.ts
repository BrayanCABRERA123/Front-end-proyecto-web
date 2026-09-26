import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


// datos que recibe el modal (se pasan como llaves de traducción)
export interface SuccessModalData {
  title: string;
  message: string;
  buttonText?: string;
}

// modal reutilizable para mostrar un mensaje de éxito (registro, guardado, etc.)
@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './success-modal.html',
  styleUrl: './success-modal.scss'
})
export class SuccessModal {

  title: string;
  message: string;
  buttonText: string;

  constructor(
    private dialogRef: MatDialogRef<SuccessModal>,
    @Inject(MAT_DIALOG_DATA) private data: SuccessModalData
  ) {
    this.title = data.title;
    this.message = data.message;
    // si no se envía texto para el botón, usamos "Aceptar" por defecto
    this.buttonText = data.buttonText ?? 'COMMON.ACCEPT';
  }

  // cierra el modal
  close() {
    this.dialogRef.close(true);
  }
}
