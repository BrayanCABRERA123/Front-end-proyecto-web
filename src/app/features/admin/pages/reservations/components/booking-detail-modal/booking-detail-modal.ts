import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Booking, BookingStatus } from '../../../../models/admin.models';
import { supportsInspection } from '../../../inspection/inspection';

// resultado de las acciones del modal: cambiar estado o abrir otra ventana
export interface BookingDetailResult {
  action: 'status' | 'assign' | 'edit' | 'inspection';
  status?: BookingStatus;
}

@Component({
  selector: 'app-booking-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './booking-detail-modal.html',
  styleUrl: './booking-detail-modal.scss',
})
export class BookingDetailModal {

  constructor(
    private dialogRef: MatDialogRef<BookingDetailModal>,
    @Inject(MAT_DIALOG_DATA) public booking: Booking,
  ) {}

  /** fecha en formato d/m/aaaa para la ficha */
  get dateLabel(): string {
    const [y, m, d] = this.booking.date.split('-');
    return `${d}/${m}/${y}`;
  }

  /** la única acción de avance que aplica en cada momento (el backend valida la transición) */
  get nextStatus(): 'in_progress' | 'completed' | null {
    if (this.booking.status === 'confirmed') return 'in_progress';
    if (this.booking.status === 'in_progress') return 'completed';
    return null;
  }

  /** "no asistió" solo aplica a una reserva confirmada que no empezó */
  get canMarkNoShow(): boolean {
    return this.booking.status === 'confirmed';
  }

  /** reporte de inspección por fases: solo en servicios largos (RF-027) */
  get canInspect(): boolean {
    return supportsInspection(this.booking);
  }

  openInspection(): void {
    this.dialogRef.close({ action: 'inspection' });
  }

  markNoShow(): void {
    this.dialogRef.close({ action: 'status', status: 'no_show' });
  }

  /** llave de traducción del botón de cambio de estado */
  get nextStatusKey(): string {
    return 'BOOKING_DETAIL.STATUS_ACTION.' + this.nextStatus;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  changeStatus(): void {
    if (this.nextStatus) {
      this.dialogRef.close({ action: 'status', status: this.nextStatus });
    }
  }

  assignOperator(): void {
    this.dialogRef.close({ action: 'assign' });
  }

  edit(): void {
    this.dialogRef.close({ action: 'edit' });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'status', status: 'cancelled' });
  }
}