import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AppNotification,
  notificationTypeClass,
  notificationTypeLabel
} from '../notification-models/notification.model';
import { NotificationTarget } from '../notification-models/notification-target';

// la notificación + a dónde lleva su botón "Ir a..." (null = no tiene apartado propio)
export type NotificationDetailData = AppNotification & { target?: NotificationTarget | null };

@Component({
  selector: 'app-notification-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './notification-detail-modal.html',
  styleUrl: './notification-detail-modal.scss'
})
export class NotificationDetailModal {

  typeClass = notificationTypeClass;
  typeLabel = notificationTypeLabel;

  constructor(
    private dialogRef: MatDialogRef<NotificationDetailModal>,
    private router: Router,
    // la notificación llega directo como "data" al abrir el modal
    @Inject(MAT_DIALOG_DATA) public notification: NotificationDetailData
  ) {}

  close() {
    this.dialogRef.close();
  }

  // cierra el detalle y lleva al apartado de donde viene la notificación
  goTo() {
    const target = this.notification.target;
    if (!target) return;
    this.dialogRef.close();
    this.router.navigateByUrl(target.route);
  }
}