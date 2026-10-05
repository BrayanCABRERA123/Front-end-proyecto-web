import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

// ---------- forma de las respuestas de payment-service ----------

export interface PaymentAccountResponse {
  id: number;
  methodCode: string;      // NEQUI, DAVIPLATA, TRANSFERENCIA, EFECTIVO
  methodName: string;
  accountHolder: string;
  accountNumber: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
  active: boolean;
  requiresReceipt: boolean;
}

export interface PaymentMethodResponse {
  id: number;
  code: string;
  name: string;
  requiresReceipt: boolean;
}

export interface PaymentBookingInfo {
  id: number;
  code: string;
  status: string;
  total: number;
  date: string;
  startTime: string;
  services: string;
  vehicle: string;
  plate: string;
  ownerUserId: number | null;
}

export type PaymentStatusCode = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface PaymentResponse {
  id: number;
  status: PaymentStatusCode;
  amount: number;
  processedAtUtc: string | null;
  rejectionReason: string | null;
  transactionReference: string | null;
  receiptImage: string | null;
  reportedAtUtc: string | null;
  reportedBy: number | null;
  account: PaymentAccountResponse | null;
  booking: PaymentBookingInfo | null;
}

export interface SavePaymentAccountRequest {
  methodCode: string;
  accountHolder: string;
  accountNumber: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
  active: boolean;
}

/**
 * payment-service (.NET, puerto 3005). El monto lo pone el backend con el total de la reserva;
 * la web solo manda la reserva, la cuenta, la referencia y la imagen del comprobante.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsApiService {

  private readonly http = inject(HttpClient);
  private readonly api = API_BASE_URL;

  /* ---------- cliente ---------- */

  accounts(): Observable<PaymentAccountResponse[]> {
    return this.http.get<PaymentAccountResponse[]>(`${this.api}/payment-accounts`);
  }

  report(bookingId: number, paymentAccountId: number, transactionReference: string, receiptImage: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.api}/payments`, { bookingId, paymentAccountId, transactionReference, receiptImage });
  }

  mine(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.api}/payments/me`);
  }

  /* ---------- admin ---------- */

  adminList(status?: PaymentStatusCode): Observable<PaymentResponse[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<PaymentResponse[]>(`${this.api}/admin/payments`, { params });
  }

  // pago recibido en el lavadero: queda aprobado con el total de la reserva
  registerManual(bookingId: number, paymentAccountId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.api}/admin/payments`, { bookingId, paymentAccountId });
  }

  approve(id: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.api}/admin/payments/${id}/approve`, {});
  }

  reject(id: number, reason: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.api}/admin/payments/${id}/reject`, { reason });
  }

  adminAccounts(): Observable<PaymentAccountResponse[]> {
    return this.http.get<PaymentAccountResponse[]>(`${this.api}/admin/payment-accounts`);
  }

  methods(): Observable<PaymentMethodResponse[]> {
    return this.http.get<PaymentMethodResponse[]>(`${this.api}/admin/payment-methods`);
  }

  createAccount(request: SavePaymentAccountRequest): Observable<PaymentAccountResponse> {
    return this.http.post<PaymentAccountResponse>(`${this.api}/admin/payment-accounts`, request);
  }

  updateAccount(id: number, request: SavePaymentAccountRequest): Observable<PaymentAccountResponse> {
    return this.http.put<PaymentAccountResponse>(`${this.api}/admin/payment-accounts/${id}`, request);
  }
}

/** lee un archivo de imagen como data URL (QR o comprobante) */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
