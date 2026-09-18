import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  Reservation,
  reservationStatusClass,
  reservationStatusIcon,
  reservationStatusLabel
} from '../../../../../../shared/dialogs/reservation-models/reservation.model';

@Component({
  selector: 'app-pending-service-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './pending-service-card.html',
  styleUrl: './pending-service-card.scss'
})
export class PendingServiceCardComponent {
  @Input() reservation!: Reservation;

  @Output() start = new EventEmitter<Reservation>();
  @Output() viewDetail = new EventEmitter<Reservation>();

  statusClass = reservationStatusClass;
  statusIcon = reservationStatusIcon;
  statusLabel = reservationStatusLabel;
}
