import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of } from 'rxjs';

import { readStorage, writeStorage } from './local-storage';
import { PhotoStorageService } from './photo-storage';
import {
  INSPECTION_PHASES,
  InspectionBookingSnapshot,
  InspectionFinding,
  InspectionPhase,
  InspectionPhaseStatus,
  NewFindingRequest,
  VehicleInspectionReport,
} from '../models/inspection.models';

/**
 * Reportes de inspección del vehículo (RF-027).
 *
 * Todavía no hay backend (operations-service no existe): los reportes se guardan en este
 * navegador (localStorage) y las fotos en IndexedDB. Por eso, mientras sea mock, el enlace
 * público solo abre en el mismo navegador donde se creó el reporte.
 *
 * Todos los métodos devuelven Observable para que al llegar la API solo cambie esta clase.
 * Contrato propuesto para el backend:
 *   GET    /api/bookings/{id}/inspection                    -> reporte (404 si no existe)
 *   POST   /api/bookings/{id}/inspection                    -> crea el reporte
 *   PATCH  /api/bookings/{id}/inspection/phases/{phase}     { status }
 *   POST   /api/bookings/{id}/inspection/findings           multipart: phase, area, severity, note, photos[]
 *   DELETE /api/bookings/{id}/inspection/findings/{findingId}
 *   POST   /api/bookings/{id}/inspection/publish            -> { publicToken }
 *   GET    /api/public/inspections/{token}                  sin autenticación, solo lectura
 */
const REPORTS_KEY = 'adminInspectionReports';

@Injectable({ providedIn: 'root' })
export class InspectionStore {

  private readonly photos = inject(PhotoStorageService);

  // reportes por id de reserva
  private readonly state = signal<Record<string, VehicleInspectionReport>>(readStorage(REPORTS_KEY, {}));

  /** reporte de una reserva, o null si todavía no se ha iniciado */
  getByBooking(bookingId: string): Observable<VehicleInspectionReport | null> {
    return of(this.state()[bookingId] ?? null);
  }

  /** reporte publicado por su token; null si no existe o no está publicado */
  getByPublicToken(token: string): Observable<VehicleInspectionReport | null> {
    // se relee el almacenamiento por si el admin lo publicó en otra pestaña
    const reports = readStorage<Record<string, VehicleInspectionReport>>(REPORTS_KEY, {});
    const report = Object.values(reports).find(r => r.publicToken === token);
    return of(report && report.published ? report : null);
  }

  startReport(bookingId: string, booking: InspectionBookingSnapshot): Observable<VehicleInspectionReport> {
    const existing = this.state()[bookingId];
    if (existing) return of(existing);

    const report: VehicleInspectionReport = {
      bookingId,
      booking,
      publicToken: crypto.randomUUID(),
      phases: INSPECTION_PHASES.map(phase => ({
        phase,
        status: 'PENDING',
        startedAt: null,
        finishedAt: null,
        findings: [],
      })),
      published: false,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    };
    return of(this.save(report));
  }

  setPhaseStatus(bookingId: string, phase: InspectionPhase, status: InspectionPhaseStatus): Observable<VehicleInspectionReport> {
    const now = new Date().toISOString();
    return of(this.mutate(bookingId, report => ({
      ...report,
      phases: report.phases.map(p => {
        if (p.phase !== phase) return p;
        return {
          ...p,
          status,
          startedAt: status === 'PENDING' ? null : (p.startedAt ?? now),
          finishedAt: status === 'DONE' ? now : null,
        };
      }),
    })));
  }

  /** guarda las fotos (ya comprimidas) y agrega el hallazgo a la fase */
  addFinding(bookingId: string, phase: InspectionPhase, request: NewFindingRequest): Observable<VehicleInspectionReport> {
    return from((async () => {
      const photoIds: string[] = [];
      for (const blob of request.photos) {
        photoIds.push(await this.photos.save(blob));
      }

      const finding: InspectionFinding = {
        id: crypto.randomUUID(),
        phase,
        area: request.area.trim(),
        severity: request.severity,
        note: request.note.trim(),
        photoIds,
        createdAt: new Date().toISOString(),
      };

      const now = new Date().toISOString();
      return this.mutate(bookingId, report => ({
        ...report,
        phases: report.phases.map(p => p.phase !== phase ? p : {
          ...p,
          // registrar un hallazgo en una fase pendiente la deja en curso
          status: p.status === 'PENDING' ? 'IN_PROGRESS' : p.status,
          startedAt: p.startedAt ?? now,
          findings: [...p.findings, finding],
        }),
      }));
    })());
  }

  removeFinding(bookingId: string, findingId: string): Observable<VehicleInspectionReport> {
    const report = this.state()[bookingId];
    const finding = report?.phases.flatMap(p => p.findings).find(f => f.id === findingId);
    if (finding) {
      this.photos.remove(finding.photoIds);
    }
    return of(this.mutate(bookingId, r => ({
      ...r,
      phases: r.phases.map(p => ({ ...p, findings: p.findings.filter(f => f.id !== findingId) })),
    })));
  }

  publish(bookingId: string): Observable<VehicleInspectionReport> {
    return of(this.mutate(bookingId, report => ({
      ...report,
      published: true,
      publishedAt: report.publishedAt ?? new Date().toISOString(),
    })));
  }

  /* ---------- internos ---------- */

  private mutate(bookingId: string, change: (report: VehicleInspectionReport) => VehicleInspectionReport): VehicleInspectionReport {
    const current = this.state()[bookingId];
    if (!current) throw new Error('INSPECTION_NOT_FOUND');
    return this.save({ ...change(current), updatedAt: new Date().toISOString() });
  }

  private save(report: VehicleInspectionReport): VehicleInspectionReport {
    this.state.update(all => ({ ...all, [report.bookingId]: report }));
    writeStorage(REPORTS_KEY, this.state());
    return report;
  }
}
