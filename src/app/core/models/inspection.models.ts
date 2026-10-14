// reporte de inspección del vehículo para servicios largos (RF-027).
// lo guarda operations-service: el admin lo llena por fases y el cliente lo ve en un enlace
// público de solo lectura. Las reglas (qué reservas lo admiten, cuándo se edita, el resumen y la
// placa enmascarada del enlace) las aplica el backend; aquí solo están los tipos de sus respuestas.

export type InspectionPhase = 'RECEPTION' | 'EXTERIOR' | 'INTERIOR' | 'ENGINE' | 'DELIVERY';
export type InspectionPhaseStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type FindingSeverity = 'INFO' | 'MINOR' | 'MAJOR';

// ícono de Material de cada fase
export const PHASE_ICONS: Record<InspectionPhase, string> = {
  RECEPTION: 'login',
  EXTERIOR: 'local_car_wash',
  INTERIOR: 'airline_seat_recline_normal',
  ENGINE: 'build',
  DELIVERY: 'task_alt',
};

// solo para decidir si se muestra el botón "Inspección" en el detalle de la reserva;
// la regla la vuelve a aplicar operations-service al abrir o editar el reporte
export const LONG_SERVICE_MIN_MINUTES = 180;

/** url relativa a /api/v1 desde la que se pide la foto */
export interface InspectionPhoto {
  id: number;
  url: string;
}

export interface InspectionFinding {
  id: number;
  phase: InspectionPhase;
  /** parte del vehículo, ej. "puerta trasera derecha" */
  area: string;
  severity: FindingSeverity;
  note: string;
  createdAt: string;
  photos: InspectionPhoto[];
}

export interface InspectionPhaseEntry {
  phase: InspectionPhase;
  status: InspectionPhaseStatus;
  startedAt: string | null;
  finishedAt: string | null;
  findings: InspectionFinding[];
}

export interface InspectionSummary {
  phasesDone: number;
  phasesTotal: number;
  findings: number;
  majorFindings: number;
  progressPercent: number;
}

/** datos de la reserva copiados al crear el reporte */
export interface InspectionBookingInfo {
  code: string;
  vehicle: string;
  plate: string;
  services: string;
  date: string;
  time: string;
  durationMinutes: number;
}

export interface VehicleInspectionReport {
  bookingId: number;
  booking: InspectionBookingInfo;
  /** token aleatorio del enlace público; nunca el id ni el código de la reserva */
  publicToken: string;
  phases: InspectionPhaseEntry[];
  summary: InspectionSummary;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

/** lo que ve el admin: si la reserva admite reporte, si se puede editar y el reporte (o null) */
export interface InspectionState {
  available: boolean;
  editable: boolean;
  report: VehicleInspectionReport | null;
}

/** lo que ve el cliente por el enlace: sin ids ni token y con la placa enmascarada */
export interface PublicInspectionReport {
  bookingCode: string;
  vehicle: string;
  maskedPlate: string;
  services: string;
  date: string;
  time: string;
  phases: InspectionPhaseEntry[];
  summary: InspectionSummary;
  publishedAt: string | null;
  updatedAt: string;
}

export interface NewFindingRequest {
  area: string;
  severity: FindingSeverity;
  note: string;
  photos: Blob[];
}
