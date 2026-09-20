export type NotificationType =
  | 'recordatorio'
  | 'promocion'
  | 'confirmacion'
  | 'cancelacion'
  | 'mensaje'
  | 'sistema';

export interface AppNotification {
  id: number;
  icon: string;
  type: NotificationType;
  title: string;
  desc: string;
  date: string;
  time: string;
  read: boolean;
}

export function notificationTypeClass(type: NotificationType): string {
  if (type === 'cancelacion') return 'type-error';
  if (type === 'mensaje' || type === 'sistema') return 'type-neutral';
  return 'type-primary';
}

export function notificationTypeLabel(type: NotificationType): string {
  return 'NOTIFICATIONS.TYPE_LABEL.' + type.toUpperCase();
}