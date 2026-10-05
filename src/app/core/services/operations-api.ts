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
}

/**
 * operations-service (puerto 3004): operarios, asignación, ejecución y calificaciones. Las reglas
 * (turno, ausencias, cruces, quién puede empezar o calificar) las aplica el backend.
 */
@Injectable({ providedIn: 'root' })
export class OperationsApiService {

  private readonly http = inject(HttpClient);
  private readonly api = API_BASE_URL;

  /* ---------- admin ---------- */

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
}

/** fecha local aaaa-mm-dd (sin desfase de zona) */
export function localIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
