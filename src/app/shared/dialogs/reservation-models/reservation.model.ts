export type ReservationStatus = 'finalizado' | 'en_progreso' | 'pendiente';

export interface Reservation {
  id: number;
  code: string;
  date: string;
  time: string;
  service: string;
  client: string;
  vehicle: string;
  address: string;
  durationMin: number;
  status: ReservationStatus;
}

export function reservationStatusClass(status: ReservationStatus): string {
  if (status === 'finalizado') return 'badge-completed';
  if (status === 'en_progreso') return 'badge-in-progress';
  return 'badge-pending';
}

export function reservationStatusIcon(status: ReservationStatus): string {
  if (status === 'finalizado') return 'check_circle';
  if (status === 'en_progreso') return 'play_circle';
  return 'schedule';
}

export function reservationStatusLabel(status: ReservationStatus): string {
  return 'SCHEDULE.STATUS.' + status.toUpperCase();
}

export function reservationVehicleIcon(vehicle: string): string {
  if (vehicle === 'MOTO') return 'two_wheeler';
  if (vehicle === 'TRUCK' || vehicle === 'PICKUP') return 'local_shipping';
  return 'directions_car';
}
