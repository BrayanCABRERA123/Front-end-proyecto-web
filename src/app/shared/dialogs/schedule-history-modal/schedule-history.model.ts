// Modelo de datos que el modal de historial recibe desde la pantalla de
// "Horarios y bahías". Se separa del componente igual que el resto de
// diálogos de la aplicación (payment-review.model.ts, assign-operator.model.ts).

export interface ScheduleHistoryEntry {
  date: string;
  author: string;
  /** llave de traducción con el tipo de cambio registrado */
  reason: string;
  /** detalle concreto del cambio (por ejemplo el nombre de la bahía) */
  detail?: string;
}
