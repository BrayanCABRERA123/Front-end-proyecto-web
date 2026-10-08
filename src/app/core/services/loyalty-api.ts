import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

export interface LoyaltyBalance {
  points: number;
}

// promoción tal como la ve el cliente: si ya la desbloqueó con sus puntos (payment-service)
export interface PromotionForCustomer {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  benefits: string[];
  discountPercent: number;
  requiredPoints: number;
  unlocked: boolean;
}

export interface RedeemPromotionResult {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  discountAmount: number;
  newTotal: number;
}

// fidelización y cupones del cliente que llama (payment-service, /api/v1/loyalty).
@Injectable({ providedIn: 'root' })
export class LoyaltyApiService {

  private readonly http = inject(HttpClient);

  balance(): Observable<LoyaltyBalance> {
    return this.http.get<LoyaltyBalance>(`${API_BASE_URL}/loyalty/balance`);
  }

  promotions(): Observable<PromotionForCustomer[]> {
    return this.http.get<PromotionForCustomer[]>(`${API_BASE_URL}/loyalty/promotions`);
  }

  redeem(bookingId: number, code: string): Observable<RedeemPromotionResult> {
    return this.http.post<RedeemPromotionResult>(`${API_BASE_URL}/loyalty/redeem`, { bookingId, code });
  }
}
