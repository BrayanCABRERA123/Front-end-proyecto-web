import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  ServicioHistorial,
  claseEstadoHistorial,
  iconoEstadoHistorial,
  labelEstadoHistorial
} from '../../../../../../shared/dialogs/history-models/service-history.model';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './history-table.html',
  styleUrl: './history-table.scss'
})
export class HistoryTableComponent {
  @Input() services: ServicioHistorial[] = [];
  @Output() viewDetail = new EventEmitter<ServicioHistorial>();

  statusClass = claseEstadoHistorial;
  statusIcon = iconoEstadoHistorial;
  statusLabel = labelEstadoHistorial;

  filledStars(rating: number | null): number[] {
    return Array(rating ?? 0).fill(0);
  }
}
