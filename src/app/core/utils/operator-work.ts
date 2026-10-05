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
    status: workStatus(s.status)
  };
}
