import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Promotion } from '../../../../models/admin.models';

export type PromotionStatus = Promotion['status'];

// si llega una promoción, el modal está en modo edición y arranca con sus valores
export interface PromotionModalData {
  promotion?: Promotion;
}

export interface PromotionModalResult {
  name: string;
  description: string;
  price: number;
  durationMin: number;
  couponCode: string;
  redemptions: number;
  featured: boolean;
  icon: string;
  features: string[];
  status: PromotionStatus;
  startDate: string;
}

// íconos coherentes con el catálogo de servicios (los mismos de las tarjetas)
const ICON_OPTIONS = ['directions_car', 'water_drop', 'auto_awesome', 'local_offer', 'star', 'savings'];

@Component({
  selector: 'app-promotion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './promotion-modal.html',
  styleUrl: './promotion-modal.scss',
})
export class PromotionModal {

  iconOptions = ICON_OPTIONS;

  name = '';
  description = '';
  price: number | null = null;
  durationMin: number | null = null;
  couponCode = '';
  redemptions = 0;
  featured = false;
  icon = ICON_OPTIONS[0];
  status: PromotionStatus = 'active';
  startDate = new Date().toISOString().slice(0, 10);
  features: string[] = [];

  editing = false;
  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<PromotionModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: PromotionModalData | null,
  ) {
    const p = data?.promotion;
    if (p) {
      this.editing = true;
      this.name = p.name;
      this.description = p.description;
      this.price = p.price;
      this.durationMin = p.durationMin;
      this.couponCode = p.couponCode;
      this.redemptions = p.redemptions;
      this.featured = p.featured;
      this.icon = p.icon;
      this.status = p.status;
      this.startDate = p.startDate;
      this.features = [...p.features];
    }
  }

  /* ---------- validación visible por campo ---------- */

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 3;
  }

  get descriptionInvalid(): boolean {
    return this.submitted && this.description.trim().length < 3;
  }

  get priceInvalid(): boolean {
    return this.submitted && (!this.price || this.price <= 0);
  }

  get durationInvalid(): boolean {
    return this.submitted && (!this.durationMin || this.durationMin <= 0);
  }

  get couponInvalid(): boolean {
    return this.submitted && this.couponCode.trim().length < 3;
  }

  get canSave(): boolean {
    return this.name.trim().length >= 3
      && this.description.trim().length >= 3
      && !!this.price && this.price > 0
      && !!this.durationMin && this.durationMin > 0
      && this.couponCode.trim().length >= 3;
  }

  /* ---------- lista de características ---------- */

  addFeature(): void {
    this.features = [...this.features, ''];
  }

  removeFeature(index: number): void {
    this.features = this.features.filter((_, i) => i !== index);
  }

  trackByIndex(index: number): number {
    return index;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const result: PromotionModalResult = {
      name: this.name.trim(),
      description: this.description.trim(),
      price: this.price ?? 0,
      durationMin: this.durationMin ?? 0,
      couponCode: this.couponCode.trim().toUpperCase(),
      redemptions: this.redemptions,
      featured: this.featured,
      icon: this.icon,
      features: this.features.map(f => f.trim()).filter(f => f.length > 0),
      status: this.status,
      startDate: this.startDate,
    };

    this.dialogRef.close(result);
  }
}