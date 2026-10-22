import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { canStartNow, startFromLabel } from '../../../../../../core/utils/operator-work';
// modales reutilizables: confirmación y mensaje de estado
import { ConfirmModal, ConfirmModalData } from '../../../../../../shared/dialogs/confirm-modal/confirm-modal';
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';

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
    this.confirmThen(
      { title: 'ASSIGNED_SERVICES.DETAIL.START_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.START_MESSAGE', confirmText: 'ASSIGNED_SERVICES.DETAIL.START_CONFIRM' },
      () => this.advance.emit('IN_PROGRESS')
    );
  }

  // usa los mismos textos de confirmación que "Mi Agenda"
  finishService(): void {
    this.confirmThen(
      { title: 'SCHEDULE.FINISH_TITLE', message: 'SCHEDULE.FINISH_MESSAGE', confirmText: 'SCHEDULE.FINISH_CONFIRM' },
      () => this.advance.emit('COMPLETED')
    );
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
        { label: 'BOOKING_DETAIL.PHONE', value: this.service.phone },
        { label: 'BOOKING_DETAIL.VEHICLE', value: this.service.vehicle }
      ]
    };

    this.dialog.open(StatusModal, { panelClass: 'custom-dialog', data });
  }

  // pide confirmación; el éxito lo avisa el padre cuando el servidor responde
  private confirmThen(
    confirm: Pick<ConfirmModalData, 'title' | 'message' | 'confirmText'>,
    onConfirm: () => void
  ): void {
    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data: { ...confirm, messageParams: { code: this.service.id }, danger: false } as ConfirmModalData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) onConfirm();
    });
  }
}
