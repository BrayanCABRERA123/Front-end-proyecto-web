// disponibilidad del operario dentro del modal de asignación
export type OperatorAvailability = 'available' | 'busy' | 'unavailable';

export interface AvailableOperator {
  id: string;
  initials: string;
  name: string;
  specialty: string;
  rating: number;
  availability: OperatorAvailability;
  // texto libre que se muestra cuando no está disponible, ej: "Ocupado 14:00-15:30 (Bahía 2)"
  availabilityNote?: string;
}

// lo que la reserva le pasa al modal para que muestre el resumen de la cita
export interface AssignOperatorModalData {
  bookingCode: string;
  client: string;
  vehicle: string;
  plate: string;
  service: string;
  timeLabel: string;
  bay: string;
  operators: AvailableOperator[];
}

// lo que devuelve el modal al cerrar con "Confirmar Asignación"
export interface AssignOperatorResult {
  operatorId: string;
  notes: string;
}
