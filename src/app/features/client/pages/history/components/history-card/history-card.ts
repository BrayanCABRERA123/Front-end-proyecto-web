import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RatingModalComponent } from '../../../../../../shared/dialogs/rating-modal/rating-modal';
import { Booking } from '../../../../../../core/services/bookings';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, MatDialogModule],
  templateUrl: './history-card.html',
  styleUrl: './history-card.scss'
})
export class HistoryCardComponent {

  // recibe la reserva del padre
  @Input() service!: Booking;

  // avisa al padre cuando se guardó la calificación
  @Output() rated = new EventEmitter<Booking>();

  // inyeccion de servicios
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog
  ) { }

  // los extras son servicios adicionales de la misma reserva (códigos del catálogo)
  getTranslatedExtras(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('SERVICE.' + e));
  }

  openRating(service: Booking): void {

    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '600px',
      data: service
    });

    dialogRef.afterClosed().subscribe((updated?: Booking) => {
      if (updated) this.rated.emit(updated);
    });

  }
}
