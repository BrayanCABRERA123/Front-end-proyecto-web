import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PhotoStorageService } from '../../../core/services/photo-storage';

/**
 * Miniatura de una foto del reporte de inspección.
 *
 * Recibe el id de la foto y la busca en el almacenamiento; al hacer clic emite la url
 * para que la pantalla la muestre ampliada. Lo usan el admin y la vista pública.
 */
@Component({
  selector: 'app-inspection-photo',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button type="button" class="inspection-photo" (click)="url() && open.emit(url()!)" [disabled]="!url()">
      @if (url()) {
        <img [src]="url()" alt="">
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

  private readonly photos = inject(PhotoStorageService);

  readonly url = signal<string | null>(null);
  readonly missing = signal(false);

  @Output() open = new EventEmitter<string>();

  @Input({ required: true }) set photoId(id: string) {
    this.url.set(null);
    this.missing.set(false);
    this.photos.url(id)
      .then(url => url ? this.url.set(url) : this.missing.set(true))
      .catch(() => this.missing.set(true));
  }
}
