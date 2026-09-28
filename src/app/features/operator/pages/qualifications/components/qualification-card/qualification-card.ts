import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar el detalle (tipo info)
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';


@Component({
  selector: 'app-qualification-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './qualification-card.html',
  styleUrl: './qualification-card.scss'
})
export class QualificationCardComponent {

  // recibe los datos del padre
  @Input() rating: any;
  @Input() stars: number[] = [];

  constructor(private dialog: MatDialog) {}

  // muestra el detalle de la calificación en el modal de estado
  viewDetail(): void {
    const data: StatusModalData = {
      type: 'info',
      icon: 'star',
      title: 'QUALIFICATION_CARD.DETAIL_TITLE',
      message: 'QUALIFICATION_CARD.DETAIL_MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'BOOKING_DETAIL.CLIENT', value: this.rating.client },
        { label: 'BOOKING_DETAIL.SERVICE', value: this.rating.serviceType },
        { label: 'BOOKING_DETAIL.DATE', value: this.rating.date },
        { label: 'SERVICE_HISTORY.DETAIL.RATING', value: '★'.repeat(this.rating.rating) + '☆'.repeat(5 - this.rating.rating) },
        { label: 'QUALIFICATION_CARD.COMMENT', value: this.rating.comment },
        { label: 'QUALIFICATION_CARD.DURATION', value: this.rating.duration }
      ]
    };

    this.dialog.open(StatusModal, { panelClass: 'custom-dialog', data });
  }
}
