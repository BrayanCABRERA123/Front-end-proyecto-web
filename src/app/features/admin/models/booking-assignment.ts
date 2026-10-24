import { Booking } from './admin.models';

export type AssignAction = 'assign' | 'reassign';

/**
 * A-02: el administrador asigna o cambia el operario mientras la reserva no haya empezado
 * (programada o confirmada y todavía modificable). operations-service reasigna las líneas existentes.
 */
export function assignActionOf(booking: Pick<Booking, 'changeable' | 'status' | 'operator'>): AssignAction | null {
  if (!booking.changeable || (booking.status !== 'scheduled' && booking.status !== 'confirmed')) return null;
  return booking.operator ? 'reassign' : 'assign';
}
