import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppNotification, NotificationType, toAppNotification } from '../dialogs/notification-models/notification.model';
import { FeedbackService } from '../dialogs/feedback.service';
// servicio que habla con el notification-service
import { NotificationsService } from '../../core/services/notifications';
import { NotificationWatcher } from '../../core/services/notification-watcher';
// convierte un error del backend en la llave de traducción API_ERRORS.<code>
import { apiErrorKey } from '../../core/utils/api-error';

export type NotificationTab = 'all' | 'recordatorio' | 'promocion' | 'confirmacion' | 'others';

/**
 * Bandeja de notificaciones de cliente, operario y administrador (notification-service): cada acción
 * (marcar, borrar) se guarda en el backend y la lista se actualiza con lo que él responde.
 */
@Injectable()
export class NotificationsViewModel {

  private readonly api = inject(NotificationsService);
  private readonly watcher = inject(NotificationWatcher);
  private readonly feedback = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(true);
  // llave de traducción del error de carga (null = sin error)
  readonly loadError = signal<string | null>(null);

  readonly tabs: { key: NotificationTab; icon: string; label: string }[] = [
    { key: 'all',           icon: 'mail',          label: 'NOTIFICATIONS.TABS.ALL' },
    { key: 'recordatorio',  icon: 'schedule',       label: 'NOTIFICATIONS.TABS.REMINDERS' },
    { key: 'promocion',     icon: 'sell',           label: 'NOTIFICATIONS.TABS.PROMOS' },
    { key: 'confirmacion',  icon: 'check_circle',   label: 'NOTIFICATIONS.TABS.CONFIRMATIONS' },
    { key: 'others',        icon: 'notifications',  label: 'NOTIFICATIONS.TABS.OTHERS' }
  ];
  readonly activeTab = signal<NotificationTab>('all');

  // filtros: se aplican apenas cambian (igual que en el historial)
  readonly statusFilter = signal<'all' | 'read' | 'unread'>('all');
  // fechas en formato "aaaa-mm-dd" (lo que dan los inputs de fecha)
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly totalUnread = computed(() => this.countUnread('all'));

  // filtros de lo que se ve (el orden, más recientes primero, ya viene del backend)
  readonly filteredNotifications = computed(() => {
    const tab = this.activeTab();
    const status = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.notifications().filter(n => {
      if (tab !== 'all' && this.tabForType(n.type) !== tab) return false;
      if (status === 'read' && !n.read) return false;
      if (status === 'unread' && n.read) return false;
      // rango de fechas (n.date también viene como "aaaa-mm-dd")
      if (from && n.date < from) return false;
      if (to && n.date > to) return false;
      return true;
    });
  });

  load(): void {
    this.reload();
    // llegaron notificaciones nuevas mientras la página está abierta: se recarga sola
    this.watcher.arrived.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload());
  }

  // pide la bandeja al backend
  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().subscribe({
      next: items => {
        this.notifications.set(items.map(toAppNotification));
        this.loading.set(false);
        this.watcher.refresh();
      },
      error: error => {
        this.loadError.set(apiErrorKey(error));
        this.loading.set(false);
      }
    });
  }

  changeTab(tab: NotificationTab): void {
    this.activeTab.set(tab);
  }

  resetFilters(): void {
    this.statusFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  countUnread(tab: NotificationTab): number {
    return this.notifications().filter(n => !n.read && (tab === 'all' || this.tabForType(n.type) === tab)).length;
  }

  markAsRead(n: AppNotification): void {
    this.api.markRead(n.id).subscribe({
      next: updated => this.replace(toAppNotification(updated)),
      error: error => this.showError(error)
    });
  }

  markAsUnread(n: AppNotification): void {
    this.api.markUnread(n.id).subscribe({
      next: updated => this.replace(toAppNotification(updated)),
      error: error => this.showError(error)
    });
  }

  // el backend marca todas; se recarga para mostrar exactamente su estado
  markAllAsRead(): void {
    this.api.markAllRead().subscribe({
      next: () => this.reload(),
      error: error => this.showError(error)
    });
  }

  // la vista ya pidió la confirmación
  remove(n: AppNotification): void {
    this.api.remove(n.id).subscribe({
      next: () => {
        this.notifications.update(list => list.filter(x => x.id !== n.id));
        this.watcher.refresh();
        this.feedback.success('NOTIFICATIONS.DELETED_TITLE', 'NOTIFICATIONS.DELETED_MESSAGE');
      },
      error: error => this.showError(error)
    });
  }

  private tabForType(type: NotificationType): NotificationTab {
    if (type === 'recordatorio') return 'recordatorio';
    if (type === 'promocion') return 'promocion';
    if (type === 'confirmacion') return 'confirmacion';
    return 'others';
  }

  // reemplaza la notificación con la versión que devolvió el backend;
  // el contador del menú sigue lo que se leyó aquí
  private replace(updated: AppNotification): void {
    this.notifications.update(list => list.map(n => n.id === updated.id ? updated : n));
    this.watcher.refresh();
  }

  private showError(error: unknown): void {
    this.feedback.error('COMMON.ERROR', apiErrorKey(error));
  }
}
