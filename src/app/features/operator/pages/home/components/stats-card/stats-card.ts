import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './stats-card.html',
  styleUrl: './stats-card.scss'
})
export class StatsCardComponent {

  // recibe los datos de la stat desde el padre
  @Input() stat: any;
}