import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Reservation,
  reservationStatusClass,
  reservationStatusIcon,
  reservationStatusLabel,
  reservationVehicleIcon
} from '../reservation-models/reservation.model';

@Component({
  selector: 'app-reservation-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './reservation-detail-modal.html',
  styleUrl: './reservation-detail-modal.scss'
})
export class ReservationDetailModal {

  statusClass = reservationStatusClass;
  statusIcon = reservationStatusIcon;
  statusLabel = reservationStatusLabel;
  vehicleIcon = reservationVehicleIcon;

  constructor(
    private dialogRef: MatDialogRef<ReservationDetailModal>,
    @Inject(MAT_DIALOG_DATA) public reservation: Reservation
  ) {}

  close() {
    this.dialogRef.close();
  }

  start() {
    this.dialogRef.close('start');
  }

  finish() {
    this.dialogRef.close('finish');
  }
}
