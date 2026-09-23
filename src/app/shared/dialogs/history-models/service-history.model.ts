export type HistoryStatus = 'finalizado' | 'cancelado' | 'reasignado';

export interface ServiceHistoryItem {
  id: number;
  code: string;
  date: string;
  time: string;
  service: string;
  vehicle: string;
  plate: string;
  client: string;
  address: string;
  paymentMethod: string | null; // código payment_method_type (NEQUI, CASH...); null si no ha pagado
  amount: number;
  rating: number | null;
  comment: string | null;
  status: HistoryStatus;
  reason: string | null;
}

export function historyStatusClass(status: HistoryStatus): string {
  if (status === 'finalizado') return 'badge-completed';
  if (status === 'cancelado') return 'badge-canceled';
  return 'badge-reassigned';
}

export function historyStatusIcon(status: HistoryStatus): string {
  if (status === 'finalizado') return 'check_circle';
  if (status === 'cancelado') return 'cancel';
  return 'sync_alt';
}

export function historyStatusLabel(status: HistoryStatus): string {
  return 'SERVICE_HISTORY.STATUS.' + status.toUpperCase();
}
