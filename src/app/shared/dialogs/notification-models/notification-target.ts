// a qué parte de la app lleva el botón "Ir a..." del detalle de una notificación.
// Solo navegación: el texto lo escribe el backend; aquí se elige dónde se ve cada tipo de aviso
// (misma tabla que la app móvil, core/services/notifications/push/notificationRoutes.ts).
export interface NotificationTarget {
  route: string;
  // llave de traducción del botón (GO_TO.*)
  label: string;
}

type Role = 'CLIENT' | 'OPERATOR' | 'ADMIN';

const CLIENT_HOME: NotificationTarget = { route: '/client', label: 'GO_TO.HOME' };
// en el historial está cada reserva con su estado, su pago y la calificación
const CLIENT_HISTORY: NotificationTarget = { route: '/client/history', label: 'GO_TO.HISTORY' };
const OPERATOR_HOME: NotificationTarget = { route: '/operator', label: 'GO_TO.HOME' };
const OPERATOR_ASSIGNED: NotificationTarget = { route: '/operator/assigned-services', label: 'GO_TO.ASSIGNED' };
const ADMIN_HOME: NotificationTarget = { route: '/admin', label: 'GO_TO.HOME' };
const ADMIN_RESERVATIONS: NotificationTarget = { route: '/admin/reservations', label: 'GO_TO.RESERVATIONS' };

const TABLES: Record<Role, Record<string, NotificationTarget>> = {
  CLIENT: {
    USER_WELCOME: CLIENT_HOME,
    BOOKING_CREATED: CLIENT_HISTORY,
    BOOKING_CONFIRMED: CLIENT_HISTORY,
    BOOKING_CANCELLED: CLIENT_HISTORY,
    BOOKING_REMINDER: CLIENT_HISTORY,
    OPERATOR_ASSIGNED: CLIENT_HISTORY,
    SERVICE_STARTED: CLIENT_HISTORY,
    SERVICE_COMPLETED: CLIENT_HISTORY,
    INSPECTION_REPORT: CLIENT_HISTORY,
    PAYMENT_CONFIRMED: CLIENT_HISTORY,
    PAYMENT_REJECTED: CLIENT_HISTORY,
    PAYMENT_REFUNDED: CLIENT_HISTORY,
    // puntos y cupones se ven en el inicio
    LOYALTY_POINTS_EARNED: CLIENT_HOME,
    PROMOTION_AVAILABLE: CLIENT_HOME,
    PROMOTION_REDEEMED: CLIENT_HOME
  },
  OPERATOR: {
    USER_WELCOME: OPERATOR_HOME,
    OPERATOR_ASSIGNED: OPERATOR_ASSIGNED,
    OPERATOR_SERVICE_RESCHEDULED: OPERATOR_ASSIGNED,
    OPERATOR_SERVICE_CANCELLED: OPERATOR_ASSIGNED,
    OPERATOR_SERVICE_UNASSIGNED: OPERATOR_ASSIGNED,
    BOOKING_REMINDER: OPERATOR_ASSIGNED
  },
  ADMIN: {
    USER_WELCOME: ADMIN_HOME,
    ADMIN_BOOKING_CREATED: ADMIN_RESERVATIONS,
    ADMIN_BOOKING_RESCHEDULED: ADMIN_RESERVATIONS,
    ADMIN_BOOKING_CANCELLED: ADMIN_RESERVATIONS,
    ADMIN_BOOKING_UNASSIGNED: ADMIN_RESERVATIONS
  }
};

// null = el aviso no tiene un apartado propio (mensajes del sistema): no se muestra el botón
export function notificationTarget(role: Role, code: string): NotificationTarget | null {
  return TABLES[role][code] ?? null;
}
