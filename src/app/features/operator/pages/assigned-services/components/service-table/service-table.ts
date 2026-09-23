import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  Reservation,
  reservationStatusLabel
} from '../../../../../../shared/dialogs/reservation-models/reservation.model';

@Component({
  selector: 'app-service-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './service-table.html',
  styleUrl: './service-table.scss'
})
export class ServiceTableComponent {

  // recibe la lista de servicios del padre
  @Input() services: Reservation[] = [];

  // recibe el servicio seleccionado para resaltarlo
  @Input() selectedService: Reservation | null = null;

  // avisa al padre cuando el usuario selecciona un servicio
  @Output() serviceSelected = new EventEmitter<Reservation>();

  statusLabel = reservationStatusLabel;

  // se ejecuta cuando el usuario hace clic en una fila
  onSelectService(service: Reservation): void {
    this.serviceSelected.emit(service);
  }
}
