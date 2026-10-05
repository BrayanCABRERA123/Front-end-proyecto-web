import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
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

  // el padre llama a booking-service; aquí solo se confirma con el operario
  @Output() advance = new EventEmitter<'IN_PROGRESS' | 'COMPLETED'>();

  constructor(private dialog: MatDialog) {}

  startService(): void {
    this.confirmThenNotify(
      { title: 'ASSIGNED_SERVICES.DETAIL.START_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.START_MESSAGE', confirmText: 'ASSIGNED_SERVICES.DETAIL.START_CONFIRM' },
      { title: 'ASSIGNED_SERVICES.DETAIL.STARTED_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.STARTED_MESSAGE' },
      () => this.advance.emit('IN_PROGRESS')
    );
  }

  reportProgress(): void {
    this.confirmThenNotify(
      { title: 'ASSIGNED_SERVICES.DETAIL.REPORT_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.REPORT_MESSAGE', confirmText: 'ASSIGNED_SERVICES.DETAIL.REPORT_CONFIRM' },
      { title: 'ASSIGNED_SERVICES.DETAIL.REPORTED_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.REPORTED_MESSAGE' }
    );
  }

  // usa los mismos textos de confirmación que "Mi Agenda"
  finishService(): void {
    this.confirmThenNotify(
      { title: 'SCHEDULE.FINISH_TITLE', message: 'SCHEDULE.FINISH_MESSAGE', confirmText: 'SCHEDULE.FINISH_CONFIRM' },
      { title: 'ASSIGNED_SERVICES.DETAIL.FINISHED_TITLE', message: 'ASSIGNED_SERVICES.DETAIL.FINISHED_MESSAGE' },
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

  // pide confirmación y, si el operario acepta, muestra el mensaje de éxito
  private confirmThenNotify(
    confirm: Pick<ConfirmModalData, 'title' | 'message' | 'confirmText'>,
    success: Pick<StatusModalData, 'title' | 'message'>,
    onConfirm?: () => void
  ): void {
    const messageParams = { code: this.service.id };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data: { ...confirm, messageParams, danger: false } as ConfirmModalData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      onConfirm?.();

      this.dialog.open(StatusModal, {
        panelClass: 'custom-dialog',
        data: { ...success, messageParams } as StatusModalData
      });
    });
  }
}
