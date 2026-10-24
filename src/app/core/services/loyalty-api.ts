import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { AmountDueResponse } from './payments-api';

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

// cupón aplicado a una reserva (a lo sumo uno, E-09)
export interface BookingRedemption {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  discountAmount: number;
}

// lo que se debe hoy por la reserva y su cupón (BIZ-02); redemption es null si no tiene cupón
export interface BookingRedemptionResponse extends AmountDueResponse {
  redemption: BookingRedemption | null;
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

  // monto a pagar y cupón aplicado de una reserva del cliente (BIZ-02): la pantalla de pago lo pide
  // al abrir, así el cupón y el total se ven igual aunque se recargue
  bookingRedemption(bookingId: number): Observable<BookingRedemptionResponse> {
    return this.http.get<BookingRedemptionResponse>(`${API_BASE_URL}/loyalty/redemptions/${bookingId}`);
  }

  // "Quitar cupón" (E-08): anula el canje en el servidor y devuelve lo que ahora falta por pagar
  removeRedemption(bookingId: number, promotionId: number): Observable<AmountDueResponse> {
    return this.http.delete<AmountDueResponse>(`${API_BASE_URL}/loyalty/redemptions/${bookingId}/${promotionId}`);
  }
}
