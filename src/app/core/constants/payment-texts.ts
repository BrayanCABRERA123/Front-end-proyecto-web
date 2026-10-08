// Textos nuevos de pagos que todavía no tienen llave en assets/i18n.
// TEMPORAL: se dejan aquí (solo en español) para no tocar los JSON de idiomas mientras otro
// compañero trabaja en ellos. Cuando se integre ese trabajo, se pasan a ADMIN_PAYMENTS /
// PAYMENT_REVIEW_MODAL en los 4 idiomas y se borra este archivo.
export const PAYMENT_TEXTS = {
  STATUS_REFUNDED: 'Reembolsado',
  REFUND: 'Reembolsar',
  REFUND_CONFIRM_TITLE: 'Reembolsar pago',
  REFUND_CONFIRM_MESSAGE: (code: string) =>
    `¿Confirmas que devolviste el dinero del pago ${code}? Se revertirán los puntos que ganó la reserva y no se puede deshacer.`,
  REFUND_CONFIRM: 'Sí, reembolsar',
  REFUNDED_TITLE: 'Pago reembolsado',
  REFUNDED_MESSAGE: (code: string) =>
    `El pago ${code} quedó reembolsado y se revirtieron los puntos de la reserva.`,
  NOT_DECLARED: 'No indicado',
  NOT_DECLARED_TITLE: 'El cliente no indicó el monto',
  NOT_DECLARED_TEXT: 'Verifica el valor directamente en la imagen del comprobante.',
} as const;
