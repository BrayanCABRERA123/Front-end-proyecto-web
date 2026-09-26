import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


// tipos de estado que puede mostrar el modal
// info: para mostrar información/detalles sin que sea un éxito o un error
export type StatusModalType = 'success' | 'error' | 'info';

// fila opcional de detalle (ej. resumen de una reserva)
// label es llave de traducción, value es el texto ya listo para mostrar
export interface StatusModalDetail {
  label: string;
  value: string;
}

// datos que recibe el modal (se pasan como llaves de traducción)
export interface StatusModalData {
  title: string;
  message: string;
  // valores opcionales para interpolar en el mensaje (ej. {{ code }})
  messageParams?: Record<string, string>;
  buttonText?: string;
  type?: StatusModalType;
  // ícono de Material opcional; si no se envía se usa el del tipo
  icon?: string;
  details?: StatusModalDetail[];
}

// ícono por defecto de cada tipo
const ICON_BY_TYPE: Record<StatusModalType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info'
};

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
  messageParams: Record<string, string>;
  buttonText: string;
  type: StatusModalType;
  details: StatusModalDetail[];

  constructor(
    private dialogRef: MatDialogRef<StatusModal>,
    @Inject(MAT_DIALOG_DATA) private data: StatusModalData
  ) {
    this.title = data.title;
    this.message = data.message;
    this.messageParams = data.messageParams ?? {};
    // si no se envía texto para el botón, usamos "Aceptar" por defecto
    this.buttonText = data.buttonText ?? 'COMMON.ACCEPT';
    // si no se envía el tipo, el modal es de éxito por defecto
    this.type = data.type ?? 'success';
    // si no se envían detalles, no se muestra la lista
    this.details = data.details ?? [];
  }

  // ícono enviado por quien abre el modal o, si no, el del tipo de estado
  get icon(): string {
    return this.data.icon ?? ICON_BY_TYPE[this.type];
  }

  // cierra el modal
  close() {
    this.dialogRef.close(true);
  }
}
