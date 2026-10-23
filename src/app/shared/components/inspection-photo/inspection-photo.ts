import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { InspectionPhotoService } from '../../../core/services/inspection-photos';

/**
 * Miniatura de una foto del reporte de inspección.
 *
 * Recibe la url de la foto (relativa a /api/v1, la da operations-service) y si exige sesión;
 * al hacer clic emite la url para que la pantalla la muestre ampliada. Lo usan el admin
 * (secure) y la vista pública.
 */
@Component({
  selector: 'app-inspection-photo',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button type="button" class="inspection-photo" (click)="url() && open.emit(url()!)" [disabled]="!url()">
      @if (url()) {
        <img [src]="url()" alt="" (error)="missing.set(true); url.set(null)">
      } @else if (missing()) {
        <mat-icon>broken_image</mat-icon>
      } @else {
        <span class="inspection-photo__loading"></span>
      }
    </button>
  `,
  styleUrl: './inspection-photo.scss',
})
export class InspectionPhotoComponent {

  private readonly photos = inject(InspectionPhotoService);

  readonly url = signal<string | null>(null);
  readonly missing = signal(false);

  @Output() open = new EventEmitter<string>();

  /** true para las fotos del admin (se piden con el token) */
  @Input() secure = false;

  @Input({ required: true }) set src(path: string) {
    this.url.set(null);
    this.missing.set(false);
    // espera un turno para que secure ya esté puesto cuando llega en el mismo binding
    queueMicrotask(() => {
      this.photos.url(path, this.secure)
        .then(url => url ? this.url.set(url) : this.missing.set(true))
        .catch(() => this.missing.set(true));
    });
  }
}
