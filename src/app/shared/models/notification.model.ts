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

export function claseTipoNotificacion(tipo: NotificationType): string {
  if (tipo === 'cancelacion') return 'tipo-error';
  if (tipo === 'mensaje' || tipo === 'sistema') return 'tipo-neutral';
  return 'tipo-primary';
}

export function labelTipoNotificacion(tipo: NotificationType): string {
  return 'NOTIFICATIONS.TYPE_LABEL.' + tipo.toUpperCase();
}