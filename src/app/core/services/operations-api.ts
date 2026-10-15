import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

// ---------- forma de las respuestas de operations-service ----------

export interface ShiftDto {
  dayOfWeek: number;   // 1 = lunes ... 7 = domingo
  startsAt: string;    // HH:mm o HH:mm:ss
  endsAt: string;
}

// semana de lunes a domingo; los null son "sin datos" (ej. sin servicios la semana anterior)
export type PunctualityLevel = 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'NO_DATA';
export interface OperatorMetricsResponse {
  weekStart: string;
  weekEnd: string;
  completedServices: number;
  previousWeekServices: number;
  servicesTrendPercent: number | null;
  punctualityPercent: number | null;
  punctualityLevel: PunctualityLevel;
  revenue: number;
  workedHours: number;
  availableHours: number;
  occupancyPercent: number | null;
}

// resumen del equipo; los null son "sin datos" (sin servicios la semana anterior o sin calificaciones)
export interface TeamSummaryResponse {
  weekStart: string;
  weekEnd: string;
  totalOperators: number;
  activeOperators: number;
  availableToday: number;
  absentToday: number;
  completedServices: number;
  previousWeekServices: number;
  servicesTrendPercent: number | null;
  averageRating: number | null;
  ratingsCount: number;
}

// operario libre para un horario, como lo ve el cliente al reservar (RF-010)
export interface AvailableOperatorResponse {
  operatorId: number;
  firstName: string;
  averageRating: number | null;
  ratingsCount: number;
}

export interface OperatorResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  hiredOn: string;
  week: ShiftDto[];
  completedServices: number;
  averageRating: number | null;
  ratingsCount: number;
}

export interface AbsenceResponse {
  id: number;
  startsAt: string;    // ISO UTC
  endsAt: string;
  reason: string;
}

export type ExecutionStatusCode = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'WITH_ISSUE';

export interface AssignmentResponse {
  bookingId: number;
  operatorId: number;
  operatorName: string;
  status: ExecutionStatusCode;
}

/** operario candidato para una reserva: available false trae el código del motivo */
export interface CandidateResponse {
  operatorId: number;
  fullName: string;
  averageRating: number | null;
  ratingsCount: number;
  assigned: boolean;
  available: boolean;
  unavailableReason: 'OPERATOR_INACTIVE' | 'OPERATOR_NOT_ON_SHIFT' | 'OPERATOR_ABSENT' | 'OPERATOR_BUSY' | null;
}

export interface OperatorServiceResponse {
  bookingId: number;
  code: string;
  bookingStatus: string;
  date: string;
  startTime: string;
  endTime: string;
  services: string;
  vehicle: string;
  plate: string;
  total: number;
  status: ExecutionStatusCode;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
  comment: string | null;
  // desde cuándo se puede iniciar (operations-service: 15 minutos antes de la reserva)
  startableAt: string | null;
}

// operario que atiende una reserva del cliente (solo su primer nombre)
export interface BookingOperatorResponse {
  bookingId: number;
  operatorName: string;
}

export interface RatingResponse {
  bookingId: number;
  bookingCode: string;
  date: string;
  services: string;
  vehicle: string;
  plate: string;
  rating: number;
  comment: string | null;
  ratedAt: string;
  operatorName: string;
  // primer nombre del cliente (lo ve el operario); vacío si security-service no lo devolvió
  clientName: string;
}

/**
 * operations-service (puerto 3004): operarios, asignación, ejecución y calificaciones. Las reglas
 * (turno, ausencias, cruces, quién puede empezar o calificar) las aplica el backend.
 */
@Injectable({ providedIn: 'root' })
export class OperationsApiService {

  private readonly http = inject(HttpClient);
  private readonly api = API_BASE_URL;

  /* ---------- cliente ---------- */

  /** operarios libres para el horario que el cliente va a reservar (RF-010) */
  availableOperators(date: string, time: string, minutes: number): Observable<AvailableOperatorResponse[]> {
    return this.http.get<AvailableOperatorResponse[]>(`${this.api}/operators/available`, {
      params: { date, time, minutes },
    });
  }

  /* ---------- admin ---------- */

  // métricas de la semana actual del operario (las calcula operations-service)
  operatorMetrics(id: number): Observable<OperatorMetricsResponse> {
    return this.http.get<OperatorMetricsResponse>(`${this.api}/admin/operators/${id}/metrics`);
  }

  // resumen del equipo para la lista de operarios (lo calcula operations-service)
  teamSummary(): Observable<TeamSummaryResponse> {
    return this.http.get<TeamSummaryResponse>(`${this.api}/admin/operators/summary`);
  }

  operators(): Observable<OperatorResponse[]> {
    return this.http.get<OperatorResponse[]>(`${this.api}/admin/operators`);
  }

  setActive(id: number, active: boolean): Observable<OperatorResponse> {
    return this.http.patch<OperatorResponse>(`${this.api}/admin/operators/${id}/status`, { active });
  }

  setAvailability(id: number, week: ShiftDto[]): Observable<OperatorResponse> {
    return this.http.put<OperatorResponse>(`${this.api}/admin/operators/${id}/availability`, { week });
  }

  absences(id: number): Observable<AbsenceResponse[]> {
    return this.http.get<AbsenceResponse[]>(`${this.api}/admin/operators/${id}/absences`);
  }

  // fechas y horas en la hora del lavadero (aaaa-mm-ddTHH:mm:ss)
  addAbsence(id: number, startsAt: string, endsAt: string, reason: string): Observable<AbsenceResponse> {
    return this.http.post<AbsenceResponse>(`${this.api}/admin/operators/${id}/absences`, { startsAt, endsAt, reason });
  }

  removeAbsence(id: number, absenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/operators/${id}/absences/${absenceId}`);
  }

  assign(bookingId: number, operatorId: number): Observable<AssignmentResponse> {
    return this.http.put<AssignmentResponse>(`${this.api}/admin/assignments/${bookingId}`, { operatorId });
  }

  // quién se puede asignar a esa reserva (turno, ausencias, cruces y estado los calcula el backend)
  candidates(bookingId: number): Observable<CandidateResponse[]> {
    return this.http.get<CandidateResponse[]>(`${this.api}/admin/assignments/${bookingId}/candidates`);
  }

  assignments(from: string, to: string): Observable<AssignmentResponse[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<AssignmentResponse[]>(`${this.api}/admin/assignments`, { params });
  }

  /* ---------- operario ---------- */

  myServices(from?: string, to?: string): Observable<OperatorServiceResponse[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<OperatorServiceResponse[]>(`${this.api}/operator/services`, { params });
  }

  start(bookingId: number): Observable<OperatorServiceResponse> {
    return this.http.post<OperatorServiceResponse>(`${this.api}/operator/services/${bookingId}/start`, {});
  }

  finish(bookingId: number): Observable<OperatorServiceResponse> {
    return this.http.post<OperatorServiceResponse>(`${this.api}/operator/services/${bookingId}/finish`, {});
  }

  myRatings(): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.api}/operator/ratings`);
  }

  /* ---------- cliente ---------- */

  rate(bookingId: number, rating: number, comment: string | null): Observable<RatingResponse> {
    return this.http.post<RatingResponse>(`${this.api}/ratings/${bookingId}`, { rating, comment });
  }

  givenRatings(): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`${this.api}/ratings/me`);
  }

  // solo trae las reservas que ya tienen operario asignado
  myBookingOperators(): Observable<BookingOperatorResponse[]> {
    return this.http.get<BookingOperatorResponse[]>(`${this.api}/operators/my-bookings`);
  }
}

/** fecha local aaaa-mm-dd (sin desfase de zona) */
export function localIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
