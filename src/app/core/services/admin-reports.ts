import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// GET /admin/reports: servicios (reservas completadas) e ingresos (pagos aprobados)
// por día de la semana actual, totales de día/semana/mes/año y ranking de servicios.
export interface AdminReports {
  days: string[];
  servicesPerDay: number[];
  revenuePerDay: number[];
  dayReport: { services: number; revenue: number };
  weekReport: { services: number; revenue: number };
  monthReport: { services: number; revenue: number };
  yearRevenue: number;
  topServices: { name: string; sales: number; percentage: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminReportsService {
  constructor(private api: Api) {}

  get$(): Observable<AdminReports> {
    return this.api.get<AdminReports>('admin/reports');
  }
}
