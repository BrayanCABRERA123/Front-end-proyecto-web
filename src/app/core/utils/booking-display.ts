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

// motivos de cancelación que la web traduce por su código (CANCEL_REASONS.*); los demás se muestran
// con el nombre que ya manda booking-service
const TRANSLATED_CANCEL_REASONS: ReadonlySet<string> = new Set(['PAYMENT_TIMEOUT']);

/** llave de traducción del motivo de cancelación, o null si se usa el nombre del backend */
export function cancellationReasonKey(code: string | null | undefined): string | null {
  return code && TRANSLATED_CANCEL_REASONS.has(code) ? `CANCEL_REASONS.${code}` : null;
}

/**
 * Hora local (HH:mm) hasta la que el cliente debe subir el comprobante, para la insignia
 * "Paga antes de las HH:mm". Solo si la reserva sigue activa, tiene plazo y el pago no se ha
 * reportado; si no, null. El plazo lo pone booking-service: aquí no se calcula.
 */
export function paymentDeadlineTime(booking: Pick<BookingResponse, 'status' | 'paymentDeadline' | 'paymentReported'>): string | null {
  if (!isActiveStatus(booking.status) || !booking.paymentDeadline || booking.paymentReported) return null;
  const deadline = new Date(booking.paymentDeadline);
  if (Number.isNaN(deadline.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
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

// la sede puede venir sin nombre, razón social, NIT o dirección (datos del negocio sin llenar):
// en vez de un hueco se muestra un texto neutro
export const BUSINESS_NAME_FALLBACK = 'LavaRápido';
export const ADDRESS_PENDING_KEY = 'COMMON.ADDRESS_PENDING';

export function businessName(location: { tradeName?: string | null } | null | undefined): string {
  return location?.tradeName?.trim() || BUSINESS_NAME_FALLBACK;
}

/** dirección de la sede, o null si no tiene (la vista muestra ADDRESS_PENDING_KEY traducida) */
export function businessAddress(location: { address?: string | null } | null | undefined): string | null {
  return location?.address?.trim() || null;
}
