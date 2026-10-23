import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';

import { NotificationsService } from '../../core/services/notifications';
import { NotificationWatcher } from '../../core/services/notification-watcher';
import { FeedbackService } from '../dialogs/feedback.service';
import { NotificationsViewModel } from './notifications.viewmodel';

const item = (id: number, category: string, sentAt: string, read: boolean) => ({
  id, type: 'X', category, title: 'Aviso ' + id, message: '', sentAt, read,
});

describe('NotificationsViewModel', () => {
  const api = { list: vi.fn(), markRead: vi.fn(), markUnread: vi.fn(), markAllRead: vi.fn(), remove: vi.fn() };
  const watcher = { arrived: new Subject<void>(), refresh: vi.fn() };
  const feedback = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    [api, feedback].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    watcher.refresh.mockReset();
    api.list.mockReturnValue(of([
      item(1, 'REMINDER', '2026-10-10T09:00:00', false),
      item(2, 'PROMOTION', '2026-10-12T09:00:00', true),
      item(3, 'CANCELLATION', '2026-10-15T09:00:00', false),
    ]));
    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsService, useValue: api },
        { provide: NotificationWatcher, useValue: watcher },
        { provide: FeedbackService, useValue: feedback },
        NotificationsViewModel,
      ],
    });
  });

  it('filtra por pestaña, estado y fechas, y cuenta las no leídas', () => {
    const vm = TestBed.inject(NotificationsViewModel);
    vm.load();

    expect(vm.totalUnread()).toBe(2);
    expect(vm.countUnread('others')).toBe(1);

    vm.changeTab('promocion');
    expect(vm.filteredNotifications().map(n => n.id)).toEqual([2]);

    vm.changeTab('all');
    vm.statusFilter.set('unread');
    vm.dateFrom.set('2026-10-11');
    expect(vm.filteredNotifications().map(n => n.id)).toEqual([3]);

    vm.resetFilters();
    expect(vm.filteredNotifications().length).toBe(3);
  });

  it('marcar y borrar actualizan la lista y el contador del menú', () => {
    api.markRead.mockReturnValue(of(item(1, 'REMINDER', '2026-10-10T09:00:00', true)));
    api.remove.mockReturnValue(of(undefined));
    const vm = TestBed.inject(NotificationsViewModel);
    vm.load();
    watcher.refresh.mockReset();

    vm.markAsRead(vm.notifications()[0]);
    vm.remove(vm.notifications()[2]);

    expect(vm.totalUnread()).toBe(0);
    expect(vm.notifications().map(n => n.id)).toEqual([1, 2]);
    expect(watcher.refresh).toHaveBeenCalledTimes(2);
    expect(feedback.success).toHaveBeenCalled();
  });

  it('si llegan notificaciones nuevas con la página abierta, recarga la bandeja', () => {
    const vm = TestBed.inject(NotificationsViewModel);
    vm.load();

    watcher.arrived.next();

    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
