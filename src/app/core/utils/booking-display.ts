// ayudas de presentación para las reservas del cliente (historial, dashboard y pago).
// el backend ya manda nombres legibles (servicio, tipo de vehículo); aquí solo se
// formatean fechas y etiquetas para no repetir la misma lógica en cada pantalla.
import { BookingResponse, BookingVehicle } from '../models/booking.models';

/** "aaaa-mm-dd" -> "dd/mm/aaaa". No usa Date para no desfasar la zona horaria. */
export function isoToDisplayDate(iso: string): string {
  const [year, month, day] = (iso ?? '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : (iso ?? '');
}

/** nombre del vehículo: marca y modelo; si no hay, el tipo de vehículo */
export function vehicleLabel(vehicle: BookingVehicle | null): string {
  if (!vehicle) return '';
  const brandModel = `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim();
  return brandModel || vehicle.vehicleTypeName;
}

/** servicios de la reserva separados por coma (nombres que ya manda el backend) */
export function servicesLabel(booking: BookingResponse): string {
  return booking.services.map(service => service.name).join(', ');
}

/** la reserva sigue viva: ocupa agenda y todavía se puede cancelar o reprogramar */
export function isActiveStatus(status: string): boolean {
  return status === 'SCHEDULED' || status === 'CONFIRMED' || status === 'IN_PROGRESS';
}

/** el lavado ya terminó: es lo único que cuenta como "servicio realizado" */
export function isFinishedStatus(status: string): boolean {
  return status === 'COMPLETED';
}
