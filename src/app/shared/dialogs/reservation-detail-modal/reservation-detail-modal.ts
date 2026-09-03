import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Reserva,
  claseEstadoReserva,
  iconoEstadoReserva,
  labelEstadoReserva,
  iconoVehiculoReserva
} from '../reservation-models/reservation.model';

@Component({
  selector: 'app-reservation-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './reservation-detail-modal.html',
  styleUrl: './reservation-detail-modal.scss'
})
export class ReservationDetailModal {

  claseEstado = claseEstadoReserva;
  iconoEstado = iconoEstadoReserva;
  labelEstado = labelEstadoReserva;
  iconoVehiculo = iconoVehiculoReserva;

  constructor(
    private dialogRef: MatDialogRef<ReservationDetailModal>,
    @Inject(MAT_DIALOG_DATA) public reserva: Reserva
  ) {}

  cerrar() {
    this.dialogRef.close();
  }

  iniciar() {
    this.dialogRef.close('iniciar');
  }

  finalizar() {
    this.dialogRef.close('finalizar');
  }
}