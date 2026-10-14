import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import {
  InspectionPhase,
  InspectionPhaseStatus,
  InspectionState,
  NewFindingRequest,
  PublicInspectionReport,
} from '../models/inspection.models';

/**
 * Reporte de inspección del vehículo (RF-027) en operations-service. Cada acción del admin
 * devuelve el estado completo, así la pantalla siempre muestra lo que quedó guardado.
 */
@Injectable({ providedIn: 'root' })
export class InspectionApiService {

  private readonly http = inject(HttpClient);
  private readonly admin = `${API_BASE_URL}/admin/inspections`;

  /** si la reserva admite reporte, si se puede editar y el reporte (null si no se ha iniciado) */
  get(bookingId: string): Observable<InspectionState> {
    return this.http.get<InspectionState>(`${this.admin}/${bookingId}`);
  }

  start(bookingId: string): Observable<InspectionState> {
    return this.http.post<InspectionState>(`${this.admin}/${bookingId}`, {});
  }

  setPhaseStatus(bookingId: string, phase: InspectionPhase, status: InspectionPhaseStatus): Observable<InspectionState> {
    return this.http.patch<InspectionState>(`${this.admin}/${bookingId}/phases/${phase}`, { status });
  }

  /** las fotos ya van comprimidas (image-compress); viajan como multipart */
  addFinding(bookingId: string, phase: InspectionPhase, request: NewFindingRequest): Observable<InspectionState> {
    const form = new FormData();
    form.append('phase', phase);
    form.append('area', request.area);
    form.append('severity', request.severity);
    form.append('note', request.note);
    request.photos.forEach((photo, i) => form.append('photos', photo, `foto-${i + 1}.jpg`));
    return this.http.post<InspectionState>(`${this.admin}/${bookingId}/findings`, form);
  }

  removeFinding(bookingId: string, findingId: number): Observable<InspectionState> {
    return this.http.delete<InspectionState>(`${this.admin}/${bookingId}/findings/${findingId}`);
  }

  publish(bookingId: string): Observable<InspectionState> {
    return this.http.post<InspectionState>(`${this.admin}/${bookingId}/publish`, {});
  }

  /** el aviso al cliente (bandeja, push y correo) lo arma notification-service con el resumen y el enlace */
  share(bookingId: string): Observable<void> {
    return this.http.post<void>(`${this.admin}/${bookingId}/share`, {});
  }

  /** reporte publicado, sin sesión */
  published(token: string): Observable<PublicInspectionReport> {
    return this.http.get<PublicInspectionReport>(`${API_BASE_URL}/public/inspections/${encodeURIComponent(token)}`);
  }
}
