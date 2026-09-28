import { ChangeDetectorRef, Component, Input } from '@angular/core';
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
import { NotificationDetailModal } from '../../dialogs/notification-detail-modal/notification-detail-modal';
import { ConfirmModal, ConfirmModalData } from '../../dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../dialogs/feedback.service';

export type { AppNotification, NotificationType };

type TabKey = 'all' | 'recordatorio' | 'promocion' | 'confirmacion' | 'others';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent {

  @Input() rol: 'CLIENT' | 'OPERATOR' | 'ADMIN' = 'CLIENT';
  @Input() notifications: AppNotification[] = [];

  activeTab: TabKey = 'all';

  tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'all',           icon: 'mail',          label: 'NOTIFICATIONS.TABS.ALL' },
    { key: 'recordatorio',  icon: 'schedule',       label: 'NOTIFICATIONS.TABS.REMINDERS' },
    { key: 'promocion',     icon: 'sell',           label: 'NOTIFICATIONS.TABS.PROMOS' },
    { key: 'confirmacion',  icon: 'check_circle',   label: 'NOTIFICATIONS.TABS.CONFIRMATIONS' },
    { key: 'others',        icon: 'notifications',  label: 'NOTIFICATIONS.TABS.OTHERS' }
  ];

  changeTab(tab: TabKey) {
    this.activeTab = tab;
  }

  private tabForType(type: NotificationType): TabKey {
    if (type === 'recordatorio') return 'recordatorio';
    if (type === 'promocion') return 'promocion';
    if (type === 'confirmacion') return 'confirmacion';
    return 'others';
  }

  // filtros: se aplican apenas cambian (igual que en el historial)
  statusFilter: 'all' | 'read' | 'unread' = 'all';
  // fechas en formato "aaaa-mm-dd" (lo que dan los inputs de fecha)
  dateFrom = '';
  dateTo = '';

  resetFilters() {
    this.statusFilter = 'all';
    this.dateFrom = '';
    this.dateTo = '';
  }

  countUnread(tab: TabKey): number {
    return this.notifications.filter(n =>
      !n.read && (tab === 'all' || this.tabForType(n.type) === tab)
    ).length;
  }

  get totalUnread(): number {
    return this.countUnread('all');
  }

  get filteredNotifications(): AppNotification[] {
    return this.notifications.filter(n => {

      if (this.activeTab !== 'all' && this.tabForType(n.type) !== this.activeTab) {
        return false;
      }

      if (this.statusFilter === 'read' && !n.read) return false;
      if (this.statusFilter === 'unread' && n.read) return false;

      // rango de fechas (n.date también viene como "aaaa-mm-dd")
      if (this.dateFrom && n.date < this.dateFrom) return false;
      if (this.dateTo && n.date > this.dateTo) return false;

      return true;
    });
  }

  markAsRead(n: AppNotification) {
    n.read = true;
  }

  markAsUnread(n: AppNotification) {
    n.read = false;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  constructor(
    private dialog: MatDialog,
    private feedback: FeedbackService,
    private cdr: ChangeDetectorRef
  ) {}

  viewDetail(n: AppNotification) {
    this.dialog.open(NotificationDetailModal, {
      panelClass: 'custom-dialog',
      data: n
    });
  }

  requestDelete(n: AppNotification) {
    const data: ConfirmModalData = {
      title: 'NOTIFICATIONS.DELETE_TITLE',
      message: 'NOTIFICATIONS.DELETE_MESSAGE'
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.notifications = this.notifications.filter(x => x.id !== n.id);
      // la app es zoneless: sin esto la tarjeta no desaparece hasta otro evento
      this.cdr.markForCheck();

      this.feedback.success('NOTIFICATIONS.DELETED_TITLE', 'NOTIFICATIONS.DELETED_MESSAGE');
    });
  }

  typeClass = notificationTypeClass;
  typeLabel = notificationTypeLabel;
}
