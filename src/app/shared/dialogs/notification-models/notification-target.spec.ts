import { NotificationResponse } from '../../../core/models/notification.models';
import { toAppNotification } from './notification.model';
import { notificationTarget } from './notification-target';

const response = (changes: Partial<NotificationResponse>): NotificationResponse => ({
  id: 1, type: 'BOOKING_CANCELLED', category: 'CANCELLATION', title: 'Reserva', message: 'Texto',
  sentAt: '2026-10-24T10:30:00Z', read: false, ...changes,
} as NotificationResponse);

describe('bandeja: tipos de notificación', () => {
  it('BOOKING_NO_SHOW se ve y lleva al mismo lugar que BOOKING_CANCELLED', () => {
    const cancelled = toAppNotification(response({}));
    const noShow = toAppNotification(response({ type: 'BOOKING_NO_SHOW' }));

    expect(noShow.icon).toBe(cancelled.icon);
    expect(noShow.type).toBe('cancelacion');
    expect(notificationTarget('CLIENT', 'BOOKING_NO_SHOW')).toEqual(notificationTarget('CLIENT', 'BOOKING_CANCELLED'));
  });

  it('un tipo o una categoría que la web no conoce no rompe la bandeja: se muestra sin botón "Ir a"', () => {
    const unknown = toAppNotification(response({ type: 'SOMETHING_NEW', category: 'NEW_CATEGORY' as never }));

    expect(unknown.type).toBe('sistema');
    expect(unknown.icon).toBeTruthy();
    expect(unknown.title).toBe('Reserva');
    expect(notificationTarget('ADMIN', 'SOMETHING_NEW')).toBeNull();
  });

  it('los avisos de reserva sin operario al reprogramar llevan a su pantalla', () => {
    expect(notificationTarget('OPERATOR', 'OPERATOR_SERVICE_UNASSIGNED')?.route).toBe('/operator/assigned-services');
    expect(notificationTarget('ADMIN', 'ADMIN_BOOKING_UNASSIGNED')?.route).toBe('/admin/reservations');
  });
});
