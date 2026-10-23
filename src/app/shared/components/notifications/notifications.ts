import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AppNotification,
  NotificationType,
  notificationTypeClass,
  notificationTypeLabel
} from '../../dialogs/notification-models/notification.model';
import { NotificationDetailModal, NotificationDetailData } from '../../dialogs/notification-detail-modal/notification-detail-modal';
import { notificationTarget } from '../../dialogs/notification-models/notification-target';
import { ConfirmModal, ConfirmModalData } from '../../dialogs/confirm-modal/confirm-modal';
import { todayIso } from '../../../core/utils/dates';
import { NotificationsViewModel } from '../../viewmodels/notifications.viewmodel';

export type { AppNotification, NotificationType };

/**
 * Centro de notificaciones de cliente, operario y administrador. La bandeja, los filtros y las
 * acciones contra el notification-service están en NotificationsViewModel.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  providers: [NotificationsViewModel],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent implements OnInit {

  readonly vm = inject(NotificationsViewModel);
  private readonly dialog = inject(MatDialog);

  // tope de los filtros de fecha: no hay historial del futuro
  readonly today = todayIso();

  @Input() rol: 'CLIENT' | 'OPERATOR' | 'ADMIN' = 'CLIENT';

  ngOnInit(): void {
    this.vm.load();
  }

  // al abrir el detalle (clic en la notificación o en "Ver detalle") queda leída;
  // el detalle trae el botón "Ir a..." hacia el apartado de donde viene el aviso
  viewDetail(n: AppNotification) {
    if (!n.read) this.vm.markAsRead(n);
    const data: NotificationDetailData = { ...n, read: true, target: notificationTarget(this.rol, n.code) };
    this.dialog.open(NotificationDetailModal, {
      panelClass: 'custom-dialog',
      data
    });
  }

  requestDelete(n: AppNotification) {
    const data: ConfirmModalData = {
      title: 'NOTIFICATIONS.DELETE_TITLE',
      message: 'NOTIFICATIONS.DELETE_MESSAGE'
    };

    this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.vm.remove(n);
    });
  }

  typeClass = notificationTypeClass;
  typeLabel = notificationTypeLabel;
}
