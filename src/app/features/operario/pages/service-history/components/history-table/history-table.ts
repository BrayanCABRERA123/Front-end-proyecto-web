import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './history-table.html',
  styleUrl: './history-table.scss'
})
export class HistoryTableComponent {

  // recibe la lista de servicios filtrados del padre
  @Input() servicios: any[] = [];
}