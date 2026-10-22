import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { InspectionApiService } from '../../../core/services/inspection-api';
import { apiErrorKey } from '../../../core/utils/api-error';
import {
  InspectionFinding,
  InspectionPhaseEntry,
  InspectionPhaseStatus,
  InspectionState,
  NewFindingRequest,
} from '../../../core/models/inspection.models';
import { ReservationsStore } from '../services/reservations-store';

/**
 * Inspección de una reserva larga (RF-036): operations-service decide si se puede iniciar o
 * editar y guarda el reporte; aquí se aplica lo que responde y se avisan los errores.
 */
@Injectable()
export class InspectionViewModel {

  private readonly reservations = inject(ReservationsStore);
  private readonly inspections = inject(InspectionApiService);
  private readonly feedback = inject(FeedbackService);

  private readonly bookingId = signal('');

  // datos de la reserva para el encabezado (cliente, estado); llegan del store
  readonly booking = computed(() => this.reservations.bookings().find(b => b.id === this.bookingId()) ?? null);

  // lo que responde operations-service: si se puede, si se edita y el reporte
  readonly state = signal<InspectionState | null>(null);
  readonly loading = signal(true);
  readonly report = computed(() => this.state()?.report ?? null);
  readonly editable = computed(() => this.state()?.editable ?? false);
  readonly supported = computed(() => this.state()?.available ?? false);

  // evita enviar el aviso dos veces mientras responde el backend
  readonly notifying = signal(false);

  load(bookingId: string): void {
    this.bookingId.set(bookingId);
    this.inspections.get(bookingId).subscribe({
      next: state => {
        this.state.set(state);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startReport(): void {
    this.apply(this.inspections.start(this.bookingId()));
  }

  setPhaseStatus(entry: InspectionPhaseEntry, status: InspectionPhaseStatus): void {
    this.apply(this.inspections.setPhaseStatus(this.bookingId(), entry.phase, status));
  }

  addFinding(entry: InspectionPhaseEntry, request: NewFindingRequest): void {
    this.apply(this.inspections.addFinding(this.bookingId(), entry.phase, request));
  }

  removeFinding(finding: InspectionFinding): void {
    this.apply(this.inspections.removeFinding(this.bookingId(), finding.id));
  }

  /** publica el reporte si hace falta y luego llama a `published` (la vista copia el enlace) */
  publish(published: () => void): void {
    const report = this.report();
    if (!report) return;
    if (report.published) {
      published();
      return;
    }
    this.apply(this.inspections.publish(this.bookingId()), published);
  }

  /**
   * Avisa al cliente (bandeja, push y correo). El mensaje con el resumen y el enlace público lo
   * arma notification-service a partir del evento que publica operations-service.
   */
  notifyClient(): void {
    if (!this.report()?.published || this.notifying()) return;
    this.notifying.set(true);
    this.inspections.share(this.bookingId()).subscribe({
      next: () => {
        this.notifying.set(false);
        this.feedback.success('INSPECTION.FEEDBACK.NOTIFIED_TITLE', 'INSPECTION.FEEDBACK.NOTIFIED_MESSAGE');
      },
      error: (error: unknown) => {
        this.notifying.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      },
    });
  }

  /** aplica la respuesta del backend o muestra su mensaje de error */
  private apply(request: Observable<InspectionState>, onDone?: () => void): void {
    request.subscribe({
      next: state => {
        this.state.set(state);
        onDone?.();
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
    });
  }
}
