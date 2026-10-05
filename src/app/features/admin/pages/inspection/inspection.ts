import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { InspectionPhotoComponent } from '../../../../shared/components/inspection-photo/inspection-photo';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { InspectionStore } from '../../../../core/services/inspection-store';
import {
  InspectionFinding,
  InspectionPhaseEntry,
  InspectionPhaseStatus,
  LONG_SERVICE_MIN_MINUTES,
  NewFindingRequest,
  PHASE_ICONS,
  VehicleInspectionReport,
} from '../../../../core/models/inspection.models';
import { ReservationsStore, formatDate, formatTimeRange } from '../../services/reservations-store';
import { Booking } from '../../models/admin.models';
import { FindingModal, FindingModalData } from './components/finding-modal/finding-modal';

/** el reporte se puede ofrecer en esta reserva: servicio largo y no cancelado */
export function supportsInspection(booking: Booking): boolean {
  return booking.durationMin >= LONG_SERVICE_MIN_MINUTES
    && ['confirmed', 'in_progress', 'completed'].includes(booking.status);
}

/** el admin solo edita mientras el vehículo está en el lavadero */
export function canEditInspection(booking: Booking): boolean {
  return booking.durationMin >= LONG_SERVICE_MIN_MINUTES
    && (booking.status === 'confirmed' || booking.status === 'in_progress');
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
  private readonly translate = inject(TranslateService);
  private readonly feedback = inject(FeedbackService);
  private readonly reservations = inject(ReservationsStore);
  private readonly inspections = inject(InspectionStore);

  readonly phaseIcons = PHASE_ICONS;
  readonly minMinutes = LONG_SERVICE_MIN_MINUTES;

  readonly bookingId = this.route.snapshot.paramMap.get('id') ?? '';

  // la reserva llega del store (puede tardar si se entra directo por la url)
  readonly booking = computed(() => this.reservations.bookings().find(b => b.id === this.bookingId) ?? null);
  readonly loadingBooking = computed(() => this.reservations.loading());

  readonly report = signal<VehicleInspectionReport | null>(null);

  // foto ampliada
  readonly preview = signal<string | null>(null);

  readonly editable = computed(() => {
    const booking = this.booking();
    return !!booking && canEditInspection(booking);
  });

  readonly supported = computed(() => {
    const booking = this.booking();
    return !!booking && supportsInspection(booking);
  });

  readonly publicLink = computed(() => {
    const report = this.report();
    return report ? `${location.origin}/report/${report.publicToken}` : '';
  });

  readonly summary = computed(() => {
    const phases = this.report()?.phases ?? [];
    const findings = phases.flatMap(p => p.findings);
    return {
      done: phases.filter(p => p.status === 'DONE').length,
      total: phases.length,
      findings: findings.length,
      major: findings.filter(f => f.severity === 'MAJOR').length,
    };
  });

  constructor() {
    this.inspections.getByBooking(this.bookingId).subscribe(report => this.report.set(report));
  }

  dateLabel(booking: Booking): string {
    return `${formatDate(booking.date)} · ${formatTimeRange(booking.time, booking.durationMin)}`;
  }

  back(): void {
    this.router.navigate(['/admin/reservations']);
  }

  /* ---------- acciones ---------- */

  startReport(): void {
    const booking = this.booking();
    if (!booking || !this.editable()) return;

    this.inspections.startReport(booking.id, {
      code: booking.code,
      vehicle: booking.vehicle,
      plate: booking.plate,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      durationMin: booking.durationMin,
    }).subscribe(report => this.report.set(report));
  }

  setPhaseStatus(entry: InspectionPhaseEntry, status: InspectionPhaseStatus): void {
    if (!this.editable()) return;
    this.inspections.setPhaseStatus(this.bookingId, entry.phase, status)
      .subscribe(report => this.report.set(report));
  }

  addFinding(entry: InspectionPhaseEntry): void {
    if (!this.editable()) return;

    const data: FindingModalData = { phase: entry.phase };
    const dialogRef = this.dialog.open(FindingModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((request: NewFindingRequest | null | undefined) => {
      if (!request) return;
      this.inspections.addFinding(this.bookingId, entry.phase, request).subscribe({
        next: report => this.report.set(report),
        error: () => this.feedback.error('COMMON.ERROR', 'INSPECTION.FEEDBACK.SAVE_ERROR'),
      });
    });
  }

  removeFinding(finding: InspectionFinding): void {
    if (!this.editable()) return;

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
        this.inspections.removeFinding(this.bookingId, finding.id).subscribe(report => this.report.set(report));
      });
  }

  /** publica el reporte (si hace falta) y copia el enlace para el cliente */
  publishAndCopy(): void {
    if (!this.report()) return;

    const publish$ = this.report()!.published
      ? this.inspections.getByBooking(this.bookingId)
      : this.inspections.publish(this.bookingId);

    publish$.subscribe(report => {
      this.report.set(report);
      this.copyLink();
    });
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

  /** abre WhatsApp con el enlace; usa el teléfono del cliente si lo tenemos */
  shareWhatsApp(): void {
    const booking = this.booking();
    const report = this.report();
    if (!report?.published) return;

    const text = this.translate.instant('INSPECTION.WHATSAPP_TEXT', {
      code: report.booking.code,
      link: this.publicLink(),
    });

    const digits = (booking?.phone ?? '').replace(/\D/g, '');
    // los celulares de Colombia tienen 10 dígitos: se agrega el indicativo 57
    const phone = digits.length === 10 ? `57${digits}` : digits;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
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
