import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// Catálogo de referencia: colecciones planas servidas tal cual por json-server
// (sin cómputo), usadas para poblar formularios (reservar lavado, pagar servicio).
export interface VehicleType {
  id: number;
  code: string;
  name: string;
  sizeFactor: number;
  isActive: boolean;
}

export interface CatalogService {
  id: number;
  code: string;
  name: string;
  description: string;
  serviceCategoryId: number;
  isActive: boolean;
}

export interface ServicePrice {
  id: number;
  serviceId: number;
  vehicleTypeId: number;
  price: number;
  estimatedMinutes: number;
}

export interface PaymentMethodType {
  id: number;
  code: string;
  name: string;
  requiresAccount: boolean;
  requiresReceipt: boolean;
  isActive: boolean;
}

export interface PaymentAccount {
  id: number;
  paymentMethodTypeId: number;
  accountHolder: string;
  accountNumber: string | null;
  instructions: string | null;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class Catalog {
  constructor(private api: Api) {}

  vehicleTypes$(): Observable<VehicleType[]> {
    return this.api.get<VehicleType[]>('vehicleTypes');
  }

  services$(): Observable<CatalogService[]> {
    return this.api.get<CatalogService[]>('services');
  }

  servicePrices$(): Observable<ServicePrice[]> {
    return this.api.get<ServicePrice[]>('servicePrices');
  }

  paymentMethodTypes$(): Observable<PaymentMethodType[]> {
    return this.api.get<PaymentMethodType[]>('paymentMethodTypes');
  }

  paymentAccounts$(): Observable<PaymentAccount[]> {
    return this.api.get<PaymentAccount[]>('paymentAccounts');
  }
}
