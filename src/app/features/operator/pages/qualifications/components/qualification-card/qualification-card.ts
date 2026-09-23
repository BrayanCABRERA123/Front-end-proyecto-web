import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { OperatorRating } from '../../../../../../core/services/operator-work';


@Component({
  selector: 'app-qualification-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './qualification-card.html',
  styleUrl: './qualification-card.scss'
})
export class QualificationCardComponent {

  // recibe los datos del padre
  @Input() rating!: OperatorRating;
  @Input() stars: number[] = [];
}
