import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Promotion } from '../../../../models/admin.models';
import { todayIso } from '../../../../../../core/utils/dates';

// si llega una promoción, el modal está en modo edición y arranca con sus valores
export interface PromotionModalData {
  promotion?: Promotion;
}

// el estado no se pide: payment-service lo calcula (programada si la fecha de inicio es futura) y
// se pausa o reactiva desde la tarjeta. Tampoco se piden precio ni duración: el cupón es un
// descuento sobre la reserva, no un paquete con precio propio (ADR-015)
export interface PromotionModalResult {
  name: string;
  description: string;
  couponCode: string;
  featured: boolean;
  icon: string;
  features: string[];
  startDate: string;
  // cupón real (ADR-015): descuento que se aplica al canjear (PERCENT = %, FIXED = pesos), y puntos
  // de fidelización necesarios para que se desbloquee; icon/featured/features son solo la tarjeta
  discountType: 'PERCENT' | 'FIXED' | 'PACKAGE';
  discountValue: number;
  requiredPoints: number;
}

// payment-service no acepta 100 %: el pago exige un monto mayor que cero (E-07)
export const MAX_DISCOUNT_PERCENT = 99;

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
  couponCode = '';
  featured = false;
  icon = ICON_OPTIONS[0];
  startDate = todayIso();
  // fecha mínima del calendario: hoy, o la que ya tenía la promoción si empezó antes
  minStartDate = todayIso();
  features: string[] = [];
  // D-01: una promoción nueva es por porcentaje; al editar se conservan el tipo y el valor que tenía
  discountType: PromotionModalResult['discountType'] = 'PERCENT';
  discountValue: number | null = 10;
  maxDiscountPercent = MAX_DISCOUNT_PERCENT;
  // number | null: si el admin borra el campo, ngModel deja null
  requiredPoints: number | null = 0;

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
      this.couponCode = p.couponCode;
      this.featured = p.featured;
      this.icon = p.icon;
      this.startDate = p.startDate;
      if (p.startDate < this.minStartDate) this.minStartDate = p.startDate;
      this.features = [...p.features];
      this.discountType = p.discountType;
      this.discountValue = p.discountValue;
      this.requiredPoints = p.requiredPoints;
    }
  }

  /* ---------- validación visible por campo ---------- */

  get nameInvalid(): boolean {
    return this.submitted && this.name.trim().length < 3;
  }

  get descriptionInvalid(): boolean {
    return this.submitted && this.description.trim().length < 3;
  }

  get couponInvalid(): boolean {
    return this.submitted && this.couponCode.trim().length < 3;
  }

  // un % va de 1 a 99 (E-07); un monto fijo solo tiene que ser mayor que cero (el servidor lo topa)
  private get discountValid(): boolean {
    const value = this.discountValue;
    if (!value || value < 1) return false;
    return this.discountType !== 'PERCENT' || value <= MAX_DISCOUNT_PERCENT;
  }

  get isFixed(): boolean {
    return this.discountType === 'FIXED';
  }

  get discountValueInvalid(): boolean {
    return this.submitted && !this.discountValid;
  }

  // entero mayor o igual a 0 (0 = el cupón está disponible para todos)
  private get requiredPointsValid(): boolean {
    return this.requiredPoints !== null && Number.isInteger(this.requiredPoints) && this.requiredPoints >= 0;
  }

  get requiredPointsInvalid(): boolean {
    return this.submitted && !this.requiredPointsValid;
  }

  get canSave(): boolean {
    return this.name.trim().length >= 3
      && !!this.startDate && this.startDate >= this.minStartDate
      && this.description.trim().length >= 3
      && this.couponCode.trim().length >= 3
      && this.discountValid
      && this.requiredPointsValid;
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
      couponCode: this.couponCode.trim().toUpperCase(),
      featured: this.featured,
      icon: this.icon,
      features: this.features.map(f => f.trim()).filter(f => f.length > 0),
      startDate: this.startDate,
      discountType: this.discountType,
      discountValue: this.discountValue ?? 0,
      requiredPoints: this.requiredPoints ?? 0,
    };

    this.dialogRef.close(result);
  }
}