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
  price: number;
  durationMinutes: number;
  icon: string | null;
  featured: boolean;
  benefits: string[];
  validFrom: string;
  validTo: string;
  status: 'active' | 'scheduled' | 'paused';
  redemptions: number;
  discountPercent: number;
  requiredPoints: number;
}

export interface PromotionMetrics {
  redemptions: number;
  savings: number;
  conversion: number;
}

export interface SavePromotionRequest {
  code: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  icon: string | null;
  featured: boolean;
  benefits: string[];
  validFrom: string;
  validTo: string;
  discountPercent: number;
  requiredPoints: number;
}

// gestión de promociones (paquetes a precio fijo) contra el payment-service (/api/v1/admin/promotions).
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
