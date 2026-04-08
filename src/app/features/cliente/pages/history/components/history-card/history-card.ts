import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './history-card.html',
  styleUrl: './history-card.scss'
})
export class HistoryCardComponent {

  // recibe el servicio del componente padre
  @Input() servicio: any;
}