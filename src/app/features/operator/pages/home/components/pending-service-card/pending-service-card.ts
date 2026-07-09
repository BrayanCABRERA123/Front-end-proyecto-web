import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pending-service-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './pending-service-card.html',
  styleUrl: './pending-service-card.scss'
})
export class PendingServiceCardComponent {

  // recibe los datos de la reserva desde el padre
  @Input() reserva: any;
}