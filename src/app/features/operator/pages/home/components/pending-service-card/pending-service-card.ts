import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  Reserva,
  claseEstadoReserva,
  iconoEstadoReserva,
  labelEstadoReserva
} from '../../../../../../shared/dialogs/reservation-models/reservation.model';

@Component({
  selector: 'app-pending-service-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './pending-service-card.html',
  styleUrl: './pending-service-card.scss'
})
export class PendingServiceCardComponent {
  @Input() reserva!: Reserva;

  @Output() iniciar = new EventEmitter<Reserva>();
  @Output() verDetalle = new EventEmitter<Reserva>();

  claseEstado = claseEstadoReserva;
  iconoEstado = iconoEstadoReserva;
  labelEstado = labelEstadoReserva;
}