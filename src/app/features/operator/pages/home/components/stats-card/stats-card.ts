import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

interface Stat {
  icono: string;
  valor: number | string;
  label: string;
  notificacion: number;
  ruta: string;
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './stats-card.html',
  styleUrl: './stats-card.scss'
})
export class StatsCardComponent {
  @Input() stat!: Stat;
  @Output() abrir = new EventEmitter<string>();
}