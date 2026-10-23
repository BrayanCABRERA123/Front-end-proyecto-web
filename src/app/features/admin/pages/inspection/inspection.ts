import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { InspectionPhotoComponent } from '../../../../shared/components/inspection-photo/inspection-photo';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import {
  InspectionFinding,
  InspectionPhaseEntry,
  LONG_SERVICE_MIN_MINUTES,
  NewFindingRequest,
  PHASE_ICONS,
} from '../../../../core/models/inspection.models';
import { formatDate, formatTimeRange } from '../../services/reservations-store';
import { Booking } from '../../models/admin.models';
import { FindingModal, FindingModalData } from './components/finding-modal/finding-modal';
import { InspectionViewModel } from '../../viewmodels/inspection.viewmodel';

/**
 * Solo decide si el detalle de la reserva muestra el botón "Inspección"; al abrir la pantalla
 * operations-service vuelve a aplicar la regla y es quien dice si se puede iniciar o editar.
 */
export function supportsInspection(booking: Booking): boolean {
  return booking.durationMin >= LONG_SERVICE_MIN_MINUTES
    && ['confirmed', 'in_progress', 'completed'].includes(booking.status);
}

// vista de la inspección: el reporte y sus acciones están en InspectionViewModel; aquí quedan los
// modales, el portapapeles, la vista pública, la foto ampliada y los formatos de hora
@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent, InspectionPhotoComponent],
  providers: [InspectionViewModel],
  templateUrl: './inspection.html',
  styleUrl: './inspection.scss',
})
export class InspectionComponent implements OnInit {

  readonly vm = inject(InspectionViewModel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly feedback = inject(FeedbackService);

  readonly phaseIcons = PHASE_ICONS;
  readonly minMinutes = LONG_SERVICE_MIN_MINUTES;

  // foto ampliada
  readonly preview = signal<string | null>(null);

  readonly publicLink = computed(() => {
    const report = this.vm.report();
    return report ? `${location.origin}/report/${report.publicToken}` : '';
  });

  ngOnInit(): void {
    this.vm.load(this.route.snapshot.paramMap.get('id') ?? '');
  }

  dateLabel(booking: Booking): string {
    return `${formatDate(booking.date)} · ${formatTimeRange(booking.time, booking.durationMin)}`;
  }

  back(): void {
    this.router.navigate(['/admin/reservations']);
  }

  /* ---------- acciones ---------- */

  addFinding(entry: InspectionPhaseEntry): void {
    const data: FindingModalData = { phase: entry.phase };
    this.dialog.open(FindingModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((request: NewFindingRequest | null | undefined) => {
        if (request) this.vm.addFinding(entry, request);
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
        if (confirmed) this.vm.removeFinding(finding);
      });
  }

  /** publica el reporte (si hace falta) y copia el enlace para el cliente */
  publishAndCopy(): void {
    this.vm.publish(() => this.copyLink());
  }

  private copyLink(): void {
    const link = this.publicLink();
    const done = () => this.feedback.success('INSPECTION.FEEDBACK.PUBLISHED_TITLE', 'INSPECTION.FEEDBACK.PUBLISHED_MESSAGE');
    // el portapapeles exige https o localhost; si falla, el enlace igual queda visible en pantalla
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(done, done);
    } else {
      done();
    }
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
