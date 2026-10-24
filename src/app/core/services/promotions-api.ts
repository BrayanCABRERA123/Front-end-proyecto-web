import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

// status: active, scheduled o paused (lo calcula el payment-service, no se guarda aparte)
export interface PromotionView {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  benefits: string[];
  validFrom: string;
  validTo: string;
  status: 'active' | 'scheduled' | 'paused';
  redemptions: number;
  discountPercent: number;
  requiredPoints: number;
  // D-01: el descuento real; en un FIXED discountPercent vale 0 y discountValue son pesos
  discountType?: DiscountTypeCode;
  discountValue?: number;
}

export interface PromotionMetrics {
  redemptions: number;
  savings: number;
}

export interface SavePromotionRequest {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  benefits: string[];
  validFrom: string;
  validTo: string;
  discountPercent: number;
  requiredPoints: number;
  // se envían tal como vienen: editar un FIXED no lo convierte a porcentaje
  discountType: DiscountTypeCode;
  discountValue: number;
}

export type DiscountTypeCode = 'PERCENT' | 'FIXED' | 'PACKAGE';

/** "10%" o "$5.000" según el tipo de descuento (sin tipo, el porcentaje de siempre) */
export function discountLabel(promotion: { discountType?: DiscountTypeCode | string; discountValue?: number; discountPercent: number }): string {
  if (promotion.discountType === 'FIXED') return '$' + Number(promotion.discountValue ?? 0).toLocaleString('es-CO');
  const percent = promotion.discountType === 'PERCENT' && promotion.discountValue != null ? promotion.discountValue : promotion.discountPercent;
  return `${percent}%`;
}

// gestión de promociones (cupones de descuento que se desbloquean con puntos) contra el
// payment-service (/api/v1/admin/promotions). price y durationMinutes ya no se usan: el backend
// los acepta vacíos y la web no los envía.
@Injectable({ providedIn: 'root' })
export class PromotionsApiService {

  private readonly http = inject(HttpClient);

  list(): Observable<PromotionView[]> {
    return this.http.get<PromotionView[]>(`${API_BASE_URL}/admin/promotions`);
  }

  metrics(): Observable<PromotionMetrics> {
    return this.http.get<PromotionMetrics>(`${API_BASE_URL}/admin/promotions/metrics`);
  }

  create(request: SavePromotionRequest): Observable<PromotionView> {
    return this.http.post<PromotionView>(`${API_BASE_URL}/admin/promotions`, request);
  }

  update(id: number, request: SavePromotionRequest): Observable<PromotionView> {
    return this.http.put<PromotionView>(`${API_BASE_URL}/admin/promotions/${id}`, request);
  }

  setActive(id: number, active: boolean): Observable<PromotionView> {
    return this.http.patch<PromotionView>(`${API_BASE_URL}/admin/promotions/${id}/active`, { active });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/admin/promotions/${id}`);
  }
}
