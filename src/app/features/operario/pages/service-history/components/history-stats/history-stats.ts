import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-stats.html',
  styleUrl: './history-stats.scss'
})
// renombramos a HistoryStatsComponent para que coincida con el import
export class HistoryStatsComponent {

  // recibe los datos del padre
  @Input() serviciosRealizados: number = 0;
  @Input() serviciosCancelados: number = 0;
}