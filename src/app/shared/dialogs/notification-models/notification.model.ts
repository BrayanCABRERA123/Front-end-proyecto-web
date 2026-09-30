import { NotificationCategory, NotificationResponse } from '../../../core/models/notification.models';

export type NotificationType =
  | 'recordatorio'
  | 'promocion'
  | 'confirmacion'
  | 'cancelacion'
  | 'mensaje'
  | 'sistema';

// notificación como la muestran la bandeja y el modal de detalle.
// title y desc son el texto que escribió el backend (ya no son llaves de traducción).
export interface AppNotification {
  id: number;
  icon: string;
  type: NotificationType;
  title: string;
  desc: string;
  date: string;   // aaaa-mm-dd en la hora del navegador
  time: string;   // HH:mm
  read: boolean;
}

// categoría del backend -> tipo que usan las pestañas y los estilos de la pantalla
const TYPE_BY_CATEGORY: Record<NotificationCategory, NotificationType> = {
  REMINDER: 'recordatorio',
  PROMOTION: 'promocion',
  CONFIRMATION: 'confirmacion',
  CANCELLATION: 'cancelacion',
  MESSAGE: 'mensaje',
  SYSTEM: 'sistema'
};

const ICON_BY_TYPE: Record<NotificationType, string> = {
  recordatorio: 'schedule',
  promocion: 'sell',
  confirmacion: 'check_circle',
  cancelacion: 'warning',
  mensaje: 'chat',
  sistema: 'desktop_windows'
};

const pad = (value: number) => String(value).padStart(2, '0');

// convierte la respuesta del backend en lo que pinta la pantalla (fecha en hora local)
export function toAppNotification(response: NotificationResponse): AppNotification {
  const sent = new Date(response.sentAt);
  const type = TYPE_BY_CATEGORY[response.category] ?? 'sistema';
  return {
    id: response.id,
    icon: ICON_BY_TYPE[type],
    type,
    title: response.title,
    desc: response.message,
    date: `${sent.getFullYear()}-${pad(sent.getMonth() + 1)}-${pad(sent.getDate())}`,
    time: `${pad(sent.getHours())}:${pad(sent.getMinutes())}`,
    read: response.read
  };
}

export function notificationTypeClass(type: NotificationType): string {
  if (type === 'cancelacion') return 'type-error';
  if (type === 'mensaje' || type === 'sistema') return 'type-neutral';
  return 'type-primary';
}

export function notificationTypeLabel(type: NotificationType): string {
  return 'NOTIFICATIONS.TYPE_LABEL.' + type.toUpperCase();
}
