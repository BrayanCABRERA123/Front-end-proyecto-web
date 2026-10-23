import { Injectable, inject, signal } from '@angular/core';

import { ReservationsStore } from '../services/reservations-store';
import { PaymentsStore } from '../services/payments-store';
import { isoDaysFromToday } from '../../../core/utils/dates';

// período visible de la gráfica y de las tarjetas resumen
export type ReportPeriod = 'day' | 'week' | 'month';

export interface ChartData {
  labels: string[];
  services: number[];
  revenue: number[];
  isEmpty: boolean;
}

export interface PeriodReport {
  services: number;
  revenue: number;
}

export interface TopService {
  name: string;
  sales: number;
  percentage: number;
}

/**
 * Reportes del admin: servicios hechos e ingresos por día, semana y mes, y los servicios más
 * pedidos. Lee de los stores de reservas y pagos (estado compartido del admin).
 */
@Injectable()
export class ReportsViewModel {

  private readonly reservations = inject(ReservationsStore);
  private readonly payments = inject(PaymentsStore);

  readonly period = signal<ReportPeriod>('week');

  setPeriod(period: ReportPeriod): void {
    this.period.set(period);
  }

  /* ---------- tarjetas resumen (día / semana / mes) ---------- */

  get dayReport(): PeriodReport {
    return {
      services: this.servicesDone(this.reservations.today),
      revenue: this.revenue(p => p.date === this.payments.today),
    };
  }

  get weekReport(): PeriodReport {
    const start = isoDaysFromToday(-6);
    return { services: this.servicesDone(start, this.reservations.today), revenue: this.revenue(p => p.date >= start) };
  }

  get monthReport(): PeriodReport {
    const start = isoDaysFromToday(-29);
    return { services: this.servicesDone(start, this.reservations.today), revenue: this.revenue(p => p.date >= start) };
  }

  // ingresos del año actual: pagos aprobados este año (A-17: antes sumaba todos los años)
  get yearRevenue(): number {
    const year = this.payments.today.slice(0, 4);
    return this.revenue(p => p.date.startsWith(year));
  }

  /* ---------- gráfica por período ---------- */

  get chartData(): ChartData {
    switch (this.period()) {
      case 'day': return this.dailyChartData();
      case 'month': return this.lastDays(30, (d, i) => i % 5 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : '');
      default: return this.lastDays(7, d => d.toLocaleDateString('es-CO', { weekday: 'short' }));
    }
  }

  // "Hoy": servicios e ingresos por franja horaria
  private dailyChartData(): ChartData {
    const labels: string[] = [];
    for (let h = 6; h <= 20; h++) {
      labels.push(String(h).padStart(2, '0') + ':00');
    }
    const today = this.reservations.byDate(this.reservations.today);
    const services = labels.map(bucket => today
      .filter(b => b.status === 'completed' && b.time.slice(0, 2) === bucket.slice(0, 2)).length);
    const revenue = labels.map(bucket =>
      this.revenue(p => p.date === this.payments.today && p.time.slice(0, 2) === bucket.slice(0, 2)));
    return withEmpty(labels, services, revenue);
  }

  // "Semana" y "Mes": un punto por día, del más antiguo a hoy
  private lastDays(count: number, label: (date: Date, daysAgo: number) => string): ChartData {
    const labels: string[] = [];
    const services: number[] = [];
    const revenue: number[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const iso = isoDaysFromToday(-i);
      labels.push(label(new Date(iso + 'T12:00:00'), i));
      services.push(this.servicesDone(iso));
      revenue.push(this.revenue(p => p.date === iso));
    }
    return withEmpty(labels, services, revenue);
  }

  /* ---------- ranking de servicios más vendidos ---------- */

  // frecuencia de cada servicio en el último mes (reservas no canceladas)
  get topServices(): TopService[] {
    const counts = new Map<string, number>();
    const start = isoDaysFromToday(-29);
    this.reservations.bookings()
      .filter(b => b.date >= start && b.status !== 'cancelled')
      .forEach(b => counts.set(b.service, (counts.get(b.service) ?? 0) + 1));

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = sorted.length ? sorted[0][1] : 0;
    return sorted.map(([name, sales]) => ({ name, sales, percentage: max ? Math.round((sales / max) * 100) : 0 }));
  }

  // servicios realizados (reservas completadas) con fecha entre from y to, ambos incluidos:
  // las futuras, las canceladas y las que quedaron en "no asistió" no son servicios hechos
  private servicesDone(from: string, to: string = from): number {
    return this.reservations.bookings()
      .filter(b => b.status === 'completed' && b.date >= from && b.date <= to).length;
  }

  // suma de los pagos aprobados que cumplen la condición
  // A-17: la fecha que se compara es la de aprobación (si falta, la del reporte)
  private revenue(match: (p: { date: string; time: string }) => boolean): number {
    return this.payments.payments()
      .filter(p => p.status === 'approved' && match({ date: p.approvedDate ?? p.date, time: p.time }))
      .reduce((sum, p) => sum + p.amount, 0);
  }
}

function withEmpty(labels: string[], services: number[], revenue: number[]): ChartData {
  return { labels, services, revenue, isEmpty: !services.some(s => s > 0) && !revenue.some(r => r > 0) };
}
