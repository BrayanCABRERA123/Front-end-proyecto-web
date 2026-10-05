import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { InspectionStore } from '../../core/services/inspection-store';
import { InspectionPhotoComponent } from '../../shared/components/inspection-photo/inspection-photo';
import { InspectionFinding, PHASE_ICONS, VehicleInspectionReport } from '../../core/models/inspection.models';

/**
 * Reporte de inspección que ve el cliente desde el enlace que le comparte el admin.
 *
 * Es público (sin sesión) y de solo lectura: no muestra correo ni teléfono, y la placa
 * va enmascarada por si el enlace termina en manos de otra persona.
 * Mientras sea mock, el enlace solo abre en el navegador donde se creó el reporte;
 * con backend funcionará desde cualquier dispositivo (GET /api/public/inspections/{token}).
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
  private readonly inspections = inject(InspectionStore);

  readonly phaseIcons = PHASE_ICONS;

  readonly loading = signal(true);
  readonly report = signal<VehicleInspectionReport | null>(null);
  readonly preview = signal<string | null>(null);

  readonly summary = computed(() => {
    const phases = this.report()?.phases ?? [];
    return {
      done: phases.filter(p => p.status === 'DONE').length,
      total: phases.length,
      findings: phases.reduce((sum, p) => sum + p.findings.length, 0),
    };
  });

  readonly progress = computed(() => {
    const { done, total } = this.summary();
    return total ? Math.round((done / total) * 100) : 0;
  });

  constructor() {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.inspections.getByPublicToken(token).subscribe(report => {
      this.report.set(report);
      this.loading.set(false);
    });
  }

  /** "ABC123" -> "ABC•••" */
  maskedPlate(plate: string): string {
    const clean = plate.replace(/[\s-]/g, '');
    return clean.length > 3 ? `${clean.slice(0, 3)}•••` : clean;
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

  updatedLabel(report: VehicleInspectionReport): string {
    return new Date(report.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  }
}
