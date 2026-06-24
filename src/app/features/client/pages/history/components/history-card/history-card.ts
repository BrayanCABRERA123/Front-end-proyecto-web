import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RatingModalComponent } from '../../../../../../shared/dialogs/rating-modal/rating-modal';

@Component({
  selector: 'app-history-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, MatDialogModule],
  templateUrl: './history-card.html',
  styleUrl: './history-card.scss'
})
export class HistoryCardComponent {

  // recibe el servicio del padre
  @Input() servicio: any;

  // inyeccion de servicios 
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog
  ) { }

  // metodo que traduce extras
  getExtrasTraducidos(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('EXTRA.' + e));
  }

  abrirCalificacion(servicio: any): void {

    this.dialog.open(RatingModalComponent, {
      width: '600px',
      data: servicio
    });

  }
}