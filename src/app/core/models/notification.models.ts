// contratos del notification-service (/api/v1/notifications), ver su README y ADR-011

// pestaña donde se muestra la notificación (la calcula el backend a partir del tipo)
export type NotificationCategory = 'REMINDER' | 'PROMOTION' | 'CONFIRMATION' | 'CANCELLATION' | 'MESSAGE' | 'SYSTEM';

// notificación como la responde el backend
export interface NotificationResponse {
  id: number;
  type: string;                    // code estable, ej. PAYMENT_CONFIRMED
  category: NotificationCategory;
  title: string;                   // texto ya escrito por el backend
  message: string;
  referenceEntity: string | null;  // ej. "booking" o "payment"
  referenceId: number | null;
  read: boolean;
  readAt: string | null;
  sentAt: string;                  // ISO en UTC
}

// aviso que el administrador envía a usuarios concretos (POST /api/v1/admin/notifications).
// type es el code del tipo; si falta, el backend usa SYSTEM_MESSAGE. El backend decide si
// además sale por correo (INSPECTION_REPORT sí, SYSTEM_MESSAGE no).
export interface AdminNotificationRequest {
  userIds: number[];
  type?: string;
  title: string;    // máximo 120 caracteres
  message: string;  // máximo 500 caracteres
}

// página de resultados (misma forma que el security-service)
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
