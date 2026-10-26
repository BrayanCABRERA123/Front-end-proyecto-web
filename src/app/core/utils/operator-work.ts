// ayudas de presentación para las pantallas del operario (inicio, agenda, servicios asignados).
// Los datos y las reglas vienen de operations-service; aquí solo se adapta la forma.
import { OperatorServiceResponse } from '../services/operations-api';
import { Reservation, ReservationStatus } from '../../shared/dialogs/reservation-models/reservation.model';

/** estado de la ejecución -> estado que pintan las tarjetas del operario */
export function workStatus(status: string): ReservationStatus {
  if (status === 'IN_PROGRESS') return 'en_progreso';
  if (status === 'COMPLETED') return 'finalizado';
  return 'pendiente';
}

/** servicio asignado -> tarjeta de reserva del operario */
export function toWorkReservation(s: OperatorServiceResponse): Reservation {
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  return {
    id: s.bookingId,
    code: s.code,
    date: s.date,
    time: s.startTime.slice(0, 5),
    service: s.services,
    client: s.plate,
    vehicle: s.vehicle,
    durationMin: Math.max(0, eh * 60 + em - (sh * 60 + sm)),
    status: workStatus(s.status),
    startableAt: s.startableAt,
    startableUntil: s.startableUntil ?? null
  };
}

/**
 * Si el botón "Iniciar" ya se puede usar. La ventana la decide operations-service: desde startableAt
 * (15 minutos antes de la reserva) hasta startableUntil (4 h después de la hora de fin); aquí solo se
 * compara con la hora actual.
 */
export function canStartNow(startableAt: string | null | undefined, startableUntil?: string | null): boolean {
  const now = Date.now();
  return (!startableAt || now >= Date.parse(startableAt)) && (!startableUntil || now <= Date.parse(startableUntil));
}

/** aviso junto al botón deshabilitado: todavía es temprano, o ya pasó el límite para iniciar */
export function startHintKey(startableAt: string | null | undefined, startableUntil?: string | null): string {
  return startableUntil && Date.now() > Date.parse(startableUntil) ? 'OPERATOR_WORK.START_TOO_LATE' : 'OPERATOR_WORK.START_FROM';
}

/** Hora local (HH:mm) desde la que se podrá iniciar, para el aviso junto al botón. */
export function startFromLabel(startableAt: string | null | undefined): string {
  if (!startableAt) return '';
  const d = new Date(startableAt);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
