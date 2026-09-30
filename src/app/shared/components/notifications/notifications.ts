import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AppNotification,
  NotificationType,
  notificationTypeClass,
  notificationTypeLabel,
  toAppNotification
} from '../../dialogs/notification-models/notification.model';
import { NotificationDetailModal } from '../../dialogs/notification-detail-modal/notification-detail-modal';
import { ConfirmModal, ConfirmModalData } from '../../dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../dialogs/feedback.service';
// servicio que habla con el notification-service
import { NotificationsService } from '../../../core/services/notifications';
// convierte un error del backend en la llave de traducción API_ERRORS.<code>
import { apiErrorKey } from '../../../core/utils/api-error';

export type { AppNotification, NotificationType };

type TabKey = 'all' | 'recordatorio' | 'promocion' | 'confirmacion' | 'others';

/**
 * Centro de notificaciones de cliente, operario y administrador con los datos reales del
 * notification-service: cada acción (marcar, borrar) se guarda en el backend y la lista se
 * actualiza con lo que él responde.
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
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent implements OnInit {

  @Input() rol: 'CLIENT' | 'OPERATOR' | 'ADMIN' = 'CLIENT';

  // se llenan al entrar a la pantalla
  notifications: AppNotification[] = [];
  loading = true;
  // llave de traducción del error de carga (null = sin error)
  loadError: string | null = null;

  activeTab: TabKey = 'all';

  tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'all',           icon: 'mail',          label: 'NOTIFICATIONS.TABS.ALL' },
    { key: 'recordatorio',  icon: 'schedule',       label: 'NOTIFICATIONS.TABS.REMINDERS' },
    { key: 'promocion',     icon: 'sell',           label: 'NOTIFICATIONS.TABS.PROMOS' },
    { key: 'confirmacion',  icon: 'check_circle',   label: 'NOTIFICATIONS.TABS.CONFIRMATIONS' },
    { key: 'others',        icon: 'notifications',  label: 'NOTIFICATIONS.TABS.OTHERS' }
  ];

  // filtros: se aplican apenas cambian (igual que en el historial)
  statusFilter: 'all' | 'read' | 'unread' = 'all';
  // fechas en formato "aaaa-mm-dd" (lo que dan los inputs de fecha)
  dateFrom = '';
  dateTo = '';

  constructor(
    private dialog: MatDialog,
    private feedback: FeedbackService,
    private cdr: ChangeDetectorRef,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  // pide la bandeja al backend
  reload(): void {
    this.loading = true;
    this.loadError = null;
    this.notificationsService.list().subscribe({
      next: (items) => {
        this.notifications = items.map(toAppNotification);
        this.loading = false;
        this.refreshView();
      },
      error: (error) => {
        this.loadError = apiErrorKey(error);
        this.loading = false;
        this.refreshView();
      }
    });
  }

  changeTab(tab: TabKey) {
    this.activeTab = tab;
  }

  private tabForType(type: NotificationType): TabKey {
    if (type === 'recordatorio') return 'recordatorio';
    if (type === 'promocion') return 'promocion';
    if (type === 'confirmacion') return 'confirmacion';
    return 'others';
  }

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

  // filtros de lo que se ve (el orden, más recientes primero, ya viene del backend)
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
    this.notificationsService.markRead(n.id).subscribe({
      next: (updated) => this.replace(toAppNotification(updated)),
      error: (error) => this.showError(error)
    });
  }

  markAsUnread(n: AppNotification) {
    this.notificationsService.markUnread(n.id).subscribe({
      next: (updated) => this.replace(toAppNotification(updated)),
      error: (error) => this.showError(error)
    });
  }

  // el backend marca todas; se recarga para mostrar exactamente su estado
  markAllAsRead() {
    this.notificationsService.markAllRead().subscribe({
      next: () => this.reload(),
      error: (error) => this.showError(error)
    });
  }

  // al abrir el detalle la notificación queda leída
  viewDetail(n: AppNotification) {
    if (!n.read) this.markAsRead(n);
    this.dialog.open(NotificationDetailModal, {
      panelClass: 'custom-dialog',
      data: { ...n, read: true }
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

      this.notificationsService.remove(n.id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(x => x.id !== n.id);
          this.refreshView();
          this.feedback.success('NOTIFICATIONS.DELETED_TITLE', 'NOTIFICATIONS.DELETED_MESSAGE');
        },
        error: (error) => this.showError(error)
      });
    });
  }

  typeClass = notificationTypeClass;
  typeLabel = notificationTypeLabel;

  // reemplaza la notificación con la versión que devolvió el backend
  private replace(updated: AppNotification) {
    this.notifications = this.notifications.map(n => n.id === updated.id ? updated : n);
    this.refreshView();
  }

  private showError(error: unknown) {
    this.feedback.error('COMMON.ERROR', apiErrorKey(error));
  }

  // la app es zoneless: los cambios que llegan del backend no se pintan solos
  private refreshView() {
    this.cdr.markForCheck();
  }
}
