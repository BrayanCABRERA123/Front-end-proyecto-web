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
  @Input() servicios: ServicioHistorial[] = [];
  @Output() verDetalle = new EventEmitter<ServicioHistorial>();

  claseEstado = claseEstadoHistorial;
  iconoEstado = iconoEstadoHistorial;
  labelEstado = labelEstadoHistorial;

  estrellasLlenas(calificacion: number | null): number[] {
    return Array(calificacion ?? 0).fill(0);
  }
}