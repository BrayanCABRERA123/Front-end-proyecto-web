import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { canStartNow, startFromLabel } from '../../../../../../core/utils/operator-work';
// modal de estado (contacto del cliente) y confirmaciones de iniciar/finalizar
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';
import { confirmFinish, confirmStart } from '../../../../components/work-confirm';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailComponent {

  // recibe el servicio seleccionado del padre
  @Input() service: any;

  // el padre llama a operations-service y avisa si se guardó; aquí solo se confirma con el operario
  @Output() advance = new EventEmitter<'IN_PROGRESS' | 'COMPLETED'>();

  // el botón "Iniciar" se habilita desde la hora que dice operations-service
  canStartNow = canStartNow;
  startFrom = startFromLabel;

  constructor(private dialog: MatDialog) {}

  startService(): void {
    confirmStart(this.dialog, this.service.id).subscribe(confirmed => {
      if (confirmed) this.advance.emit('IN_PROGRESS');
    });
  }

  // usa los mismos textos de confirmación que "Mi Agenda"
  finishService(): void {
    confirmFinish(this.dialog, this.service.id).subscribe(confirmed => {
      if (confirmed) this.advance.emit('COMPLETED');
    });
  }

  // muestra los datos de contacto del cliente en el modal de estado (tipo info)
  contactClient(): void {
    const data: StatusModalData = {
      type: 'info',
      icon: 'phone',
      title: 'ASSIGNED_SERVICES.DETAIL.CONTACT',
      message: 'ASSIGNED_SERVICES.DETAIL.CONTACT_MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'BOOKING_DETAIL.CLIENT', value: this.service.client },
        { label: 'BOOKING_DETAIL.VEHICLE', value: this.service.vehicle }
      ]
    };

    this.dialog.open(StatusModal, { panelClass: 'custom-dialog', data });
  }
}
