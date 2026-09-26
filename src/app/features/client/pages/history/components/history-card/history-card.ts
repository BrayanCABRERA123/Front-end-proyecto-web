import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RatingModalComponent, RatingModalData, RatingResult } from '../../../../../../shared/dialogs/rating-modal/rating-modal';
// modal reutilizable para mostrar mensajes de éxito
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, MatDialogModule],
  templateUrl: './history-card.html',
  styleUrl: './history-card.scss'
})
export class HistoryCardComponent {

  // recibe el servicio del padre
  @Input() service: any;

  // inyeccion de servicios
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  // metodo que traduce extras
  getTranslatedExtras(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('EXTRA.' + e));
  }

  // abre el modal para calificar o, si ya se calificó, para editar la calificación
  openRating(service: any): void {

    const isEdit = !!service.rating;

    const data: RatingModalData = {
      rating: service.rating,
      comment: service.ratingComment
    };

    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '600px',
      data
    });

    dialogRef.afterClosed().subscribe((result?: RatingResult) => {
      if (!result) return;

      service.rating = result.rating;
      service.ratingComment = result.comment;

      // la app es zoneless: avisamos a Angular que redibuje la tarjeta
      this.cdr.markForCheck();

      const status: StatusModalData = isEdit
        ? { title: 'RATINGS.UPDATED_TITLE', message: 'RATINGS.UPDATED_MESSAGE' }
        : { title: 'RATINGS.SUCCESS_TITLE', message: 'RATINGS.SUCCESS_MESSAGE' };

      this.dialog.open(StatusModal, {
        panelClass: 'custom-dialog',
        data: status
      });
    });

  }
}
