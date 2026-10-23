import { Component, Inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { FindingSeverity, InspectionPhase, NewFindingRequest } from '../../../../../../core/models/inspection.models';
import { compressImage, isValidPhoto } from '../../../../../../core/utils/image-compress';

export interface FindingModalData {
  phase: InspectionPhase;
}

// foto ya comprimida, con su vista previa
interface PendingPhoto {
  blob: Blob;
  preview: string;
}

const MAX_PHOTOS = 5;

@Component({
  selector: 'app-finding-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './finding-modal.html',
  styleUrl: './finding-modal.scss',
})
export class FindingModal implements OnDestroy {

  readonly severities: FindingSeverity[] = ['INFO', 'MINOR', 'MAJOR'];
  readonly maxPhotos = MAX_PHOTOS;

  // sugerencias para escribir rápido desde el celular
  readonly areaSuggestions = [
    'INSPECTION.AREAS.FRONT_BUMPER',
    'INSPECTION.AREAS.REAR_BUMPER',
    'INSPECTION.AREAS.DOOR',
    'INSPECTION.AREAS.HOOD',
    'INSPECTION.AREAS.ROOF',
    'INSPECTION.AREAS.FRONT_SEAT',
    'INSPECTION.AREAS.REAR_SEAT',
    'INSPECTION.AREAS.DASHBOARD',
    'INSPECTION.AREAS.WHEELS',
    'INSPECTION.AREAS.WINDOWS',
  ];

  area = '';
  note = '';
  severity: FindingSeverity = 'MINOR';

  // signals: la compresión es asíncrona y la app es zoneless
  readonly photos = signal<PendingPhoto[]>([]);
  readonly processing = signal(false);
  readonly photoError = signal<string | null>(null);

  constructor(
    private dialogRef: MatDialogRef<FindingModal, NewFindingRequest | null>,
    @Inject(MAT_DIALOG_DATA) public data: FindingModalData,
  ) {}

  get canSave(): boolean {
    return this.area.trim().length > 0 && !this.processing();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    this.photoError.set(null);

    const free = MAX_PHOTOS - this.photos().length;
    if (files.length > free) {
      this.photoError.set('INSPECTION.FINDING_MODAL.MAX_PHOTOS');
    }

    const valid = files.slice(0, Math.max(0, free)).filter(file => {
      if (isValidPhoto(file)) return true;
      this.photoError.set('INSPECTION.FINDING_MODAL.INVALID_FILE');
      return false;
    });
    if (!valid.length) return;

    this.processing.set(true);
    try {
      const added: PendingPhoto[] = [];
      for (const file of valid) {
        const blob = await compressImage(file);
        added.push({ blob, preview: URL.createObjectURL(blob) });
      }
      this.photos.update(list => [...list, ...added]);
    } catch {
      this.photoError.set('INSPECTION.FINDING_MODAL.INVALID_FILE');
    } finally {
      this.processing.set(false);
    }
  }

  removePhoto(index: number): void {
    const photo = this.photos()[index];
    if (photo) URL.revokeObjectURL(photo.preview);
    this.photos.update(list => list.filter((_, i) => i !== index));
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave) return;
    this.dialogRef.close({
      area: this.area,
      severity: this.severity,
      note: this.note,
      photos: this.photos().map(p => p.blob),
    });
  }

  ngOnDestroy(): void {
    this.photos().forEach(p => URL.revokeObjectURL(p.preview));
  }
}
