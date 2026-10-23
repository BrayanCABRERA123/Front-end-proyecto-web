import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-history-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './history-stats.html',
  styleUrl: './history-stats.scss'
})
export class HistoryStatsComponent {
  @Input() completed = 0;
  @Input() canceledOrReassigned = 0;
  @Input() totalGenerated = 0;
  @Input() averageRating = 0;
}
