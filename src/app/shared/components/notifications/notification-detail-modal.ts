import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AppNotification,
  claseTipoNotificacion,
  labelTipoNotificacion
} from '../../models/notification.model';

@Component({
  selector: 'app-notification-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './notification-detail-modal.html',
  styleUrl: './notification-detail-modal.scss'
})
export class NotificationDetailModal {

  claseTipo = claseTipoNotificacion;
  labelTipo = labelTipoNotificacion;

  constructor(
    private dialogRef: MatDialogRef<NotificationDetailModal>,
    // la notificación llega directo como "data" al abrir el modal
    @Inject(MAT_DIALOG_DATA) public notification: AppNotification
  ) {}

  cerrar() {
    this.dialogRef.close();
  }
}