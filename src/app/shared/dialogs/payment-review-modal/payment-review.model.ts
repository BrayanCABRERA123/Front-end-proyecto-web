export type PaymentMethod = 'nequi' | 'bancolombia' | 'daviplata' | 'cash';

// todo lo que la tabla de pagos le pasa al modal para revisar un pago pendiente
export interface PaymentReviewData {
  code: string; // #PAG-4902
  status: 'pending' | 'approved' | 'rejected';
  client: string;
  phone: string;
  email: string;
  bookingCode: string;
  service: string;
  vehicle: string;
  plate: string;
  scheduleLabel: string; // "Hoy, 15:00 - 16:00 (1 hora)"
  bay: string;
  operator: string;
  method: PaymentMethod;
  transactionReference: string;
  amountDue: number;
  amountDeclared: number;
  receiptDate: string; // "Hoy, 14:48 COT"
  bankAccount: string; // NIT/celular que aparece en el comprobante
}

export type PaymentReviewAction = 'approved' | 'rejected';

export interface PaymentReviewResult {
  action: PaymentReviewAction;
  reason?: string; // solo cuando action === 'rejected'
}
