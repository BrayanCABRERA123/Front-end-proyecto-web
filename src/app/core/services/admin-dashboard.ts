import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// GET /admin/dashboard: todo el resumen del día ya calculado por el mock
// (contadores, ingresos de la semana, estado de operarios, pendientes).
export interface AdminDashboard {
  adminName: string;
  stats: {
    bookingsToday: number;
    vsYesterday: number;
    servicesInProgress: number;
    activeBays: number;
    pendingPayments: number;
    revenueToday: number;
  };
  weeklyRevenue: { day: string; amount: number; label: string; isToday: boolean }[];
  weekTotal: number;
  peakDay: string | null;
  operators: { initials: string; name: string; role: string; status: 'busy' | 'available' | 'leave'; bay: string }[];
  pendingPayments: { id: number; client: string; bank: string; bankClass: string; service: string; reference: string; amount: number }[];
  unassignedCount: number;
  unassignedBookings: {
    id: number;
    time: string;
    date: string;
    bay: string;
    client: string;
    vehicle: string;
    service: string;
    isUpcoming: boolean;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  constructor(private api: Api) {}

  get$(): Observable<AdminDashboard> {
    return this.api.get<AdminDashboard>('admin/dashboard');
  }
}
