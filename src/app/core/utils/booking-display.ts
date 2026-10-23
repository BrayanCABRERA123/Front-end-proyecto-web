// ayudas de presentación para las reservas del cliente (historial, dashboard y pago).
// el backend ya manda nombres legibles (servicio, tipo de vehículo); aquí solo se
// formatean fechas y etiquetas para no repetir la misma lógica en cada pantalla.
import { BookingResponse, BookingVehicle, BusinessHourDto } from '../models/booking.models';

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

/**
 * horario de atención en una línea a partir del horario del negocio (booking-service), juntando los
 * días seguidos que abren igual: "Lunes - Viernes 07:00 - 18:00 · Sábado 08:00 - 14:00".
 * dayOfWeek va de 1 (lunes) a 7 (domingo); dayLabel traduce ese número. Sin días abiertos: "—".
 */
export function businessHoursSummary(hours: BusinessHourDto[], dayLabel: (dayOfWeek: number) => string): string {
  const time = (value: string) => (value ?? '').slice(0, 5);
  const open = [...hours].filter(day => day.working).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const groups: { from: number; to: number; range: string }[] = [];
  for (const day of open) {
    const range = `${time(day.opensAt)} - ${time(day.closesAt)}`;
    const last = groups[groups.length - 1];
    if (last && last.range === range && last.to === day.dayOfWeek - 1) {
      last.to = day.dayOfWeek;
    } else {
      groups.push({ from: day.dayOfWeek, to: day.dayOfWeek, range });
    }
  }
  if (groups.length === 0) return '—';
  return groups
    .map(g => `${g.from === g.to ? dayLabel(g.from) : `${dayLabel(g.from)} - ${dayLabel(g.to)}`} ${g.range}`)
    .join(' · ');
}
