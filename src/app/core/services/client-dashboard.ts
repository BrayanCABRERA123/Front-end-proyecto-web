import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { Vehicle } from './vehicles';
import { Booking } from './bookings';

// Endpoint agregador (GET /me/dashboard): junta stats, próximo servicio, vehículos,
// beneficios, fidelidad e historial reciente en una sola llamada, como haría un BFF real.
export interface ClientDashboard {
  stats: {
    activeReservations: number;
    vehicles: number;
    washesDone: number;
  };
  nextService: Booking | null;
  vehicles: Vehicle[];
  benefits: { title: string; description: string }[];
  loyalty: { current: number; goal: number; percentage: number };
  serviceHistory: Booking[];
}

@Injectable({ providedIn: 'root' })
export class ClientDashboardService {
  constructor(private api: Api) {}

  get$(): Observable<ClientDashboard> {
    return this.api.get<ClientDashboard>('me/dashboard');
  }
}
