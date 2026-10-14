import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { InspectionPhotoComponent } from '../../../../shared/components/inspection-photo/inspection-photo';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { InspectionApiService } from '../../../../core/services/inspection-api';
import { apiErrorKey } from '../../../../core/utils/api-error';
import {
  InspectionFinding,
  InspectionPhaseEntry,
  InspectionPhaseStatus,
  InspectionState,
  LONG_SERVICE_MIN_MINUTES,
  NewFindingRequest,
  PHASE_ICONS,
} from '../../../../core/models/inspection.models';
import { ReservationsStore, formatDate, formatTimeRange } from '../../services/reservations-store';
import { Booking } from '../../models/admin.models';
import { FindingModal, FindingModalData } from './components/finding-modal/finding-modal';

/**
 * Solo decide si el detalle de la reserva muestra el botón "Inspección"; al abrir la pantalla
 * operations-service vuelve a aplicar la regla y es quien dice si se puede iniciar o editar.
 */
export function supportsInspection(booking: Booking): boolean {
  return booking.durationMin >= LONG_SERVICE_MIN_MINUTES
    && ['confirmed', 'in_progress', 'completed'].includes(booking.status);
}

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent, InspectionPhotoComponent],
  templateUrl: './inspection.html',
  styleUrl: './inspection.scss',
})
export class InspectionComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly feedback = inject(FeedbackService);
  private readonly reservations = inject(ReservationsStore);
  private readonly inspections = inject(InspectionApiService);

  readonly phaseIcons = PHASE_ICONS;
  readonly minMinutes = LONG_SERVICE_MIN_MINUTES;

  readonly bookingId = this.route.snapshot.paramMap.get('id') ?? '';

  // datos de la reserva para el encabezado (cliente, estado); llegan del store
  readonly booking = computed(() => this.reservations.bookings().find(b => b.id === this.bookingId) ?? null);

  // lo que responde operations-service: si se puede, si se edita y el reporte
  readonly state = signal<InspectionState | null>(null);
  readonly loading = signal(true);
  readonly report = computed(() => this.state()?.report ?? null);
  readonly editable = computed(() => this.state()?.editable ?? false);
  readonly supported = computed(() => this.state()?.available ?? false);

  // foto ampliada
  readonly preview = signal<string | null>(null);

  // evita enviar el aviso dos veces mientras responde el backend
  readonly notifying = signal(false);

  readonly publicLink = computed(() => {
    const report = this.report();
    return report ? `${location.origin}/report/${report.publicToken}` : '';
  });

  constructor() {
    this.inspections.get(this.bookingId).subscribe({
      next: state => {
        this.state.set(state);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  dateLabel(booking: Booking): string {
    return `${formatDate(booking.date)} · ${formatTimeRange(booking.time, booking.durationMin)}`;
  }

  back(): void {
    this.router.navigate(['/admin/reservations']);
  }

  /* ---------- acciones ---------- */

  /** aplica la respuesta del backend o muestra su mensaje de error */
  private apply(request: Observable<InspectionState>, onDone?: () => void): void {
    request.subscribe({
      next: state => {
        this.state.set(state);
        onDone?.();
      },
      error: error => this.feedback.error('COMMON.ERROR', apiErrorKey(error)),
    });
  }

  startReport(): void {
    this.apply(this.inspections.start(this.bookingId));
  }

  setPhaseStatus(entry: InspectionPhaseEntry, status: InspectionPhaseStatus): void {
    this.apply(this.inspections.setPhaseStatus(this.bookingId, entry.phase, status));
  }

  addFinding(entry: InspectionPhaseEntry): void {
    const data: FindingModalData = { phase: entry.phase };
    const dialogRef = this.dialog.open(FindingModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((request: NewFindingRequest | null | undefined) => {
      if (!request) return;
      this.apply(this.inspections.addFinding(this.bookingId, entry.phase, request));
    });
  }

  removeFinding(finding: InspectionFinding): void {
    const confirm: ConfirmModalData = {
      title: 'INSPECTION.FEEDBACK.DELETE_TITLE',
      message: 'INSPECTION.FEEDBACK.DELETE_CONFIRM',
      messageParams: { area: finding.area },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true,
    };

    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data: confirm })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.apply(this.inspections.removeFinding(this.bookingId, finding.id));
      });
  }

  /** publica el reporte (si hace falta) y copia el enlace para el cliente */
  publishAndCopy(): void {
    if (!this.report()) return;
    if (this.report()!.published) {
      this.copyLink();
      return;
    }
    this.apply(this.inspections.publish(this.bookingId), () => this.copyLink());
  }

  private copyLink(): void {
    const link = this.publicLink();
    const done = () => this.feedback.success(
      'INSPECTION.FEEDBACK.PUBLISHED_TITLE',
      'INSPECTION.FEEDBACK.PUBLISHED_MESSAGE'
    );

    // el portapapeles exige https o localhost; si falla, el enlace igual queda visible en pantalla
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(done, done);
    } else {
      done();
    }
  }

  /**
   * Avisa al cliente (bandeja, push y correo). El mensaje con el resumen y el enlace público lo
   * arma notification-service a partir del evento que publica operations-service.
   */
  notifyClient(): void {
    if (!this.report()?.published || this.notifying()) return;

    this.notifying.set(true);
    this.inspections.share(this.bookingId).subscribe({
      next: () => {
        this.notifying.set(false);
        this.feedback.success('INSPECTION.FEEDBACK.NOTIFIED_TITLE', 'INSPECTION.FEEDBACK.NOTIFIED_MESSAGE');
      },
      error: error => {
        this.notifying.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      },
    });
  }

  openPublicView(): void {
    window.open(this.publicLink(), '_blank', 'noopener');
  }

  openPreview(url: string): void {
    this.preview.set(url);
  }

  closePreview(): void {
    this.preview.set(null);
  }

  findingTime(finding: InspectionFinding): string {
    return new Date(finding.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  phaseTime(value: string | null): string {
    return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }
}
