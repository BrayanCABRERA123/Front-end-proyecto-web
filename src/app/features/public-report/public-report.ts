import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { InspectionApiService } from '../../core/services/inspection-api';
import { InspectionPhotoComponent } from '../../shared/components/inspection-photo/inspection-photo';
import { InspectionFinding, PHASE_ICONS, PublicInspectionReport } from '../../core/models/inspection.models';

/**
 * Reporte de inspección que ve el cliente desde el enlace que le comparte el admin.
 *
 * Es público (sin sesión) y de solo lectura: lo sirve operations-service solo si está publicado,
 * sin correo ni teléfono y con la placa ya enmascarada. Abre desde cualquier dispositivo.
 */
@Component({
  selector: 'app-public-report',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, InspectionPhotoComponent],
  templateUrl: './public-report.html',
  styleUrl: './public-report.scss',
})
export class PublicReportComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly inspections = inject(InspectionApiService);

  readonly phaseIcons = PHASE_ICONS;

  readonly loading = signal(true);
  readonly report = signal<PublicInspectionReport | null>(null);
  readonly preview = signal<string | null>(null);

  constructor() {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.inspections.published(token).subscribe({
      next: report => {
        this.report.set(report);
        this.loading.set(false);
      },
      // no existe o no está publicado: la pantalla muestra "no disponible"
      error: () => this.loading.set(false),
    });
  }

  dateLabel(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  time(value: string | null): string {
    return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }

  findingTime(finding: InspectionFinding): string {
    return this.time(finding.createdAt);
  }

  updatedLabel(report: PublicInspectionReport): string {
    return new Date(report.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  }
}
