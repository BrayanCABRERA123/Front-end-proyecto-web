import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  Reservation,
  reservationStatusLabel
} from '../../../../../../shared/dialogs/reservation-models/reservation.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailComponent {

  // recibe el servicio seleccionado del padre
  @Input() service!: Reservation;

  // el padre llama al mock API (iniciar / finalizar) y recarga la lista
  @Output() start = new EventEmitter<Reservation>();
  @Output() finish = new EventEmitter<Reservation>();

  statusLabel = reservationStatusLabel;
}
