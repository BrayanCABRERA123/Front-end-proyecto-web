import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { Reservation } from '../../shared/dialogs/reservation-models/reservation.model';
import { ServiceHistoryItem } from '../../shared/dialogs/history-models/service-history.model';

// Jornada del operario autenticado. El mock API agrupa sus service_execution por reserva y
// devuelve los mismos shapes que ya usaban las pantallas (Reservation / ServiceHistoryItem),
// con los contadores y promedios ya calculados.

export interface OperatorDashboard {
  name: string;
  today: { total: number; pending: number; inProgress: number; completed: number; progressPercentage: number };
  unreadNotifications: number;
  averageRating: number;
  todayServices: Reservation[];
}

export interface OperatorAssigned {
  stats: { total: number; pending: number; inProgress: number; completedToday: number };
  items: Reservation[];
}

export interface OperatorHistory {
  stats: {
    completed: number;
    canceledOrReassigned: number;
    totalGenerated: number;
    averageRating: number;
    completionRate: number;
  };
  items: ServiceHistoryItem[];
}

export interface OperatorRating {
  id: number;
  client: string;
  service: string;
  date: string; // dd/mm/yyyy
  rating: number;
  comment: string | null;
  durationMin: number;
  location: string;
  serviceId: string;
}

export interface OperatorRatings {
  stats: {
    averageRating: number;
    totalRatings: number;
    satisfactionPercentage: number;
    satisfactionLevel: string; // clave i18n QUALIFICATION_STATS.LEVEL.*
  };
  items: OperatorRating[];
}

@Injectable({ providedIn: 'root' })
export class OperatorWorkService {
  constructor(private api: Api) {}

  dashboard$(): Observable<OperatorDashboard> {
    return this.api.get<OperatorDashboard>('me/operator/dashboard');
  }

  // servicios asignados no cancelados (pendientes, en progreso y finalizados)
  services$(): Observable<OperatorAssigned> {
    return this.api.get<OperatorAssigned>('me/operator/services');
  }

  history$(): Observable<OperatorHistory> {
    return this.api.get<OperatorHistory>('me/operator/history');
  }

  ratings$(): Observable<OperatorRatings> {
    return this.api.get<OperatorRatings>('me/operator/ratings');
  }

  // devuelven la reserva ya actualizada (el mock valida que sea del operario y el estado)
  start$(bookingId: number): Observable<Reservation> {
    return this.api.post<Reservation>(`me/operator/services/${bookingId}/start`, {});
  }

  finish$(bookingId: number): Observable<Reservation> {
    return this.api.post<Reservation>(`me/operator/services/${bookingId}/finish`, {});
  }
}
