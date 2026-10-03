import { BookingResponse, BookingStatusCode } from './booking.models';
import { isActiveStatus, isoToDisplayDate, vehicleLabel } from '../utils/booking-display';

// fila del historial del cliente: la reserva cruda del backend ya lista para pintar.
// el booking-service no maneja el estado de pago, por eso canPay se deriva de que la
// reserva siga activa y no de un campo "pagado".
export interface ClientBookingItem {
  id: number;
  code: string;
  status: BookingStatusCode;
  date: string;        // aaaa-mm-dd: se usa para el filtro por fecha
  displayDate: string; // dd/mm/aaaa
  timeRange: string;   // "08:00 - 08:45"
  services: string[];  // nombres de los servicios
  vehicle: string;
  plate: string;
  total: number;
  canPay: boolean;
  canCancel: boolean;
  canRate: boolean;
  rating?: number;
  ratingComment?: string;
}

export function toClientBookingItem(booking: BookingResponse): ClientBookingItem {
  const active = isActiveStatus(booking.status);
  return {
    id: booking.id,
    code: booking.code,
    status: booking.status,
    date: booking.date,
    displayDate: isoToDisplayDate(booking.date),
    timeRange: `${booking.startTime} - ${booking.endTime}`,
    services: booking.services.map(service => service.name),
    vehicle: vehicleLabel(booking.vehicle),
    plate: booking.vehicle?.licensePlateFormatted ?? '',
    total: booking.total,
    canPay: active,
    // changeable lo decide el backend (RF-007: ni empezada ni pasada)
    canCancel: active && booking.changeable,
    canRate: booking.status === 'COMPLETED',
  };
}
