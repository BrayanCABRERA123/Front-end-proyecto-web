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
import { NotificationsService } from '../../../core/services/notifications';

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

  statusInput: 'all' | 'read' | 'unread' = 'all';
  dateFromInput = '';
  dateToInput = '';

  private appliedStatus: 'all' | 'read' | 'unread' = 'all';
  private appliedDateFrom = '';
  private appliedDateTo = '';

  applyFilters() {
    this.appliedStatus = this.statusInput;
    this.appliedDateFrom = this.dateFromInput;
    this.appliedDateTo = this.dateToInput;
  }

  resetFilters() {
    this.statusInput = 'all';
    this.dateFromInput = '';
    this.dateToInput = '';
    this.applyFilters();
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

      if (this.appliedStatus === 'read' && !n.read) return false;
      if (this.appliedStatus === 'unread' && n.read) return false;

      if (this.appliedDateFrom && n.date < this.appliedDateFrom) return false;
      if (this.appliedDateTo && n.date > this.appliedDateTo) return false;

      return true;
    });
  }

  // Cambios optimistas: se reflejan de inmediato y se revierten si el mock API falla.
  markAsRead(n: AppNotification) {
    this.setRead(n, true);
  }

  markAsUnread(n: AppNotification) {
    this.setRead(n, false);
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.read);
    unread.forEach(n => n.read = true);

    this.notificationsService.markAllRead$().subscribe({
      error: () => {
        unread.forEach(n => n.read = false);
        this.cdr.markForCheck();
      }
    });
  }

  private setRead(n: AppNotification, read: boolean) {
    n.read = read;

    this.notificationsService.markRead$(n.id, read).subscribe({
      error: () => {
        n.read = !read;
        this.cdr.markForCheck();
      }
    });
  }

  constructor(
    private dialog: MatDialog,
    private notificationsService: NotificationsService,
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

      this.notificationsService.remove$(n.id).subscribe(() => {
        this.notifications = this.notifications.filter(x => x.id !== n.id);
        this.cdr.markForCheck();
      });
    });
  }

  typeClass = notificationTypeClass;
  typeLabel = notificationTypeLabel;
}
