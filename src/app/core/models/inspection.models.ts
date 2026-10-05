// reporte de inspección del vehículo para servicios largos (RF-027).
// lo llena el administrador por fases y el cliente lo ve en un enlace público de solo lectura.

export type InspectionPhase = 'RECEPTION' | 'EXTERIOR' | 'INTERIOR' | 'ENGINE' | 'DELIVERY';
export type InspectionPhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type FindingSeverity = 'INFO' | 'MINOR' | 'MAJOR';

// orden en que se recorre el vehículo
export const INSPECTION_PHASES: InspectionPhase[] = ['RECEPTION', 'EXTERIOR', 'INTERIOR', 'ENGINE', 'DELIVERY'];

// ícono de Material de cada fase
export const PHASE_ICONS: Record<InspectionPhase, string> = {
  RECEPTION: 'login',
  EXTERIOR: 'local_car_wash',
  INTERIOR: 'airline_seat_recline_normal',
  ENGINE: 'build',
  DELIVERY: 'task_alt',
};

// el reporte solo se ofrece en servicios de 3 horas o más
export const LONG_SERVICE_MIN_MINUTES = 180;

export interface InspectionFinding {
  id: string;
  phase: InspectionPhase;
  /** parte del vehículo, ej. "puerta trasera derecha" */
  area: string;
  severity: FindingSeverity;
  note: string;
  /** ids de las fotos guardadas aparte (IndexedDB mientras no haya backend) */
  photoIds: string[];
  createdAt: string;
}

export interface InspectionPhaseEntry {
  phase: InspectionPhase;
  status: InspectionPhaseStatus;
  startedAt: string | null;
  finishedAt: string | null;
  findings: InspectionFinding[];
}

/**
 * Datos de la reserva copiados al crear el reporte. Solo lo necesario para que el cliente
 * reconozca su vehículo: nada de correo ni teléfono, porque el enlace es público.
 */
export interface InspectionBookingSnapshot {
  code: string;
  vehicle: string;
  plate: string;
  service: string;
  date: string;
  time: string;
  durationMin: number;
}

export interface VehicleInspectionReport {
  bookingId: string;
  booking: InspectionBookingSnapshot;
  /** token aleatorio del enlace público; nunca el id ni el código de la reserva */
  publicToken: string;
  phases: InspectionPhaseEntry[];
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface NewFindingRequest {
  area: string;
  severity: FindingSeverity;
  note: string;
  photos: Blob[];
}
