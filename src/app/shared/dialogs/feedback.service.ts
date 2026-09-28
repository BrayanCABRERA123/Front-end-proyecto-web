import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { StatusModal, StatusModalData, StatusModalType } from './status-modal/status-modal';

export interface FeedbackOptions {
  /** valores para interpolar en el mensaje (ej. { name: 'Bahía 5' }) */
  messageParams?: Record<string, string | number>;
  /** filas de resumen que se muestran debajo del mensaje */
  details?: StatusModalData['details'];
  /** texto del botón; por defecto "Aceptar" */
  buttonText?: string;
}

/**
 * Punto único de feedback de la aplicación.
 *
 * Envuelve el StatusModal que ya existía en el proyecto para que todas las
 * pantallas confirmen sus acciones con el mismo diseño, sin depender de toasts
 * o alerts distintos en cada módulo.
 *
 * Cuando llegue el backend solo hay que cambiar el cuerpo de los métodos por
 * llamadas HTTP: las pantallas no cambian.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {

  constructor(private dialog: MatDialog) {}

  /** Confirmación de una operación exitosa. */
  success(title: string, message: string, options: FeedbackOptions = {}): void {
    this.open({ title, message, type: 'success', ...options });
  }

  /** Mensaje informativo (por ejemplo, el motivo por el que algo no se pudo hacer). */
  info(title: string, message: string, options: FeedbackOptions = {}): void {
    this.open({ title, message, type: 'info', ...options });
  }

  /** Error de una operación que no se pudo completar. */
  error(title: string, message: string, options: FeedbackOptions = {}): void {
    this.open({ title, message, type: 'error', ...options });
  }

  private open(data: StatusModalData): void {
    this.dialog.open(StatusModal, { panelClass: 'custom-dialog', data });
  }
}

// reexportamos el tipo para que las pantallas no importen el modal directamente
export type { StatusModalType };
