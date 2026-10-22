import { Injectable, inject, signal } from '@angular/core';

import { InspectionApiService } from '../../../core/services/inspection-api';
import { PublicInspectionReport } from '../../../core/models/inspection.models';

/**
 * Reporte de inspección publicado (operations-service): público, sin sesión y de solo lectura.
 * Si el enlace no existe o el admin no lo ha publicado, `report` queda vacío.
 */
@Injectable()
export class PublicReportViewModel {

  private readonly inspections = inject(InspectionApiService);

  readonly loading = signal(true);
  readonly report = signal<PublicInspectionReport | null>(null);

  load(token: string): void {
    this.loading.set(true);
    this.inspections.published(token).subscribe({
      next: report => {
        this.report.set(report);
        this.loading.set(false);
      },
      // no existe o no está publicado: la pantalla muestra "no disponible"
      error: () => this.loading.set(false),
    });
  }
}
