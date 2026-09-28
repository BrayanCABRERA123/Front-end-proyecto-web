// definimos el componente
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart } from 'chart.js/auto';
// modal de exportación de reportes
import { ExportReportModalComponent } from '../../../../shared/dialogs/export-report-modal/export-report-modal';
import { ReservationsStore } from '../../services/reservations-store';
import { PaymentsStore } from '../../services/payments-store';

// período visible de la gráfica y de las tarjetas resumen
type ReportPeriod = 'day' | 'week' | 'month';

interface ChartData {
  labels: string[];
  services: number[];
  revenue: number[];
  isEmpty: boolean;
}

const RANKING_COLORS = ['#2ec4b6', '#3b82f6', '#22c55e'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, EmptyStateComponent, MatIconModule, MatDialogModule, TranslateModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class ReportsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rankingCard') topServicesEl!: ElementRef<HTMLDivElement>;

  private chart?: Chart;

  period: ReportPeriod = 'week';
  periods: ReportPeriod[] = ['day', 'week', 'month'];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private reservations: ReservationsStore,
    private payments: PaymentsStore,
  ) {}

  ngAfterViewInit(): void {
    this.createChart();
    // pequeño retraso para que el navegador aplique el estado inicial (0%) antes de animar
    setTimeout(() => this.animateBars(), 100);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /* ---------- utilidades comunes ---------- */

  // fecha ISO (yyyy-MM-dd) de hace n días
  private isoDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  /* ---------- tarjetas resumen (día / semana / mes) ---------- */

  get dayReport(): { services: number; revenue: number } {
    return {
      services: this.reservations.byDate(this.reservations.today)
        .filter(b => b.status !== 'cancelled').length,
      revenue: this.payments.payments()
        .filter(p => p.date === this.payments.today && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }

  get weekReport(): { services: number; revenue: number } {
    const start = this.isoDaysAgo(6);
    return {
      services: this.reservations.bookings()
        .filter(b => b.date >= start && b.status !== 'cancelled').length,
      revenue: this.payments.payments()
        .filter(p => p.date >= start && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }

  get monthReport(): { services: number; revenue: number } {
    const start = this.isoDaysAgo(29);
    return {
      services: this.reservations.bookings()
        .filter(b => b.date >= start && b.status !== 'cancelled').length,
      revenue: this.payments.payments()
        .filter(p => p.date >= start && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }

  // ingresos del año: pagos aprobados registrados
  get yearRevenue(): number {
    return this.payments.payments()
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /* ---------- gráfica por período ---------- */

  changePeriod(period: ReportPeriod): void {
    if (this.period === period) return;
    this.period = period;
    this.chart?.destroy();
    this.createChart();
  }

  get chartData(): ChartData {
    switch (this.period) {
      case 'day': return this.dailyChartData();
      case 'month': return this.monthlyChartData();
      default: return this.weeklyChartData();
    }
  }

  // "Hoy": servicios e ingresos por franja horaria
  private dailyChartData(): ChartData {
    const buckets: string[] = [];
    for (let h = 6; h <= 20; h++) {
      buckets.push(String(h).padStart(2, '0') + ':00');
    }

    const services = buckets.map(bucket => {
      const hour = bucket.slice(0, 2);
      return this.reservations.byDate(this.reservations.today)
        .filter(b => b.status !== 'cancelled' && b.time.slice(0, 2) === hour).length;
    });

    const revenue = buckets.map(bucket => {
      const hour = bucket.slice(0, 2);
      return this.payments.payments()
        .filter(p => p.date === this.payments.today && p.status === 'approved' && p.time.slice(0, 2) === hour)
        .reduce((sum, p) => sum + p.amount, 0);
    });

    return { labels: buckets, services, revenue, isEmpty: !services.some(s => s > 0) && !revenue.some(r => r > 0) };
  }

  // "Semana": últimos 7 días por nombre de día
  private weeklyChartData(): ChartData {
    const labels: string[] = [];
    const services: number[] = [];
    const revenue: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const iso = this.isoDaysAgo(i);
      const d = new Date(iso + 'T12:00:00');
      labels.push(d.toLocaleDateString('es-CO', { weekday: 'short' }));

      services.push(this.reservations.bookings()
        .filter(b => b.date === iso && b.status !== 'cancelled').length);

      revenue.push(this.payments.payments()
        .filter(p => p.date === iso && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0));
    }

    return { labels, services, revenue, isEmpty: !services.some(s => s > 0) && !revenue.some(r => r > 0) };
  }

  // "Mes": últimos 30 días por día (etiqueta cada 5 días)
  private monthlyChartData(): ChartData {
    const labels: string[] = [];
    const services: number[] = [];
    const revenue: number[] = [];

    for (let i = 29; i >= 0; i--) {
      const iso = this.isoDaysAgo(i);
      const d = new Date(iso + 'T12:00:00');
      labels.push(i % 5 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : '');

      services.push(this.reservations.bookings()
        .filter(b => b.date === iso && b.status !== 'cancelled').length);

      revenue.push(this.payments.payments()
        .filter(p => p.date === iso && p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0));
    }

    return { labels, services, revenue, isEmpty: !services.some(s => s > 0) && !revenue.some(r => r > 0) };
  }

  // colores del tema actual (claro u oscuro) leídos de las variables CSS
  private cssVar(name: string, fallback: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  private theme() {
    return {
      text: this.cssVar('--text-secondary', '#5f6f75'),
      muted: this.cssVar('--text-muted', '#8a9aa3'),
      grid: this.cssVar('--border', '#eef2f2'),
      primary: this.cssVar('--primary', '#2ec4b6'),
      primarySoft: this.cssVar('--primary-soft', '#5eead4'),
      card: this.cssVar('--card', '#ffffff'),
      textStrong: this.cssVar('--text', '#1a1a2e'),
    };
  }

  // crea la gráfica de barras con tooltip personalizado y animación de entrada
  private createChart(): void {
    const t = this.theme();
    const data = this.chartData;

    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: this.translate.instant('REPORTS.CHART.SERVICES'),
            data: data.services,
            backgroundColor: '#0f5a52',
            yAxisID: 'yServicios',
            borderRadius: 4,
            barPercentage: 0.5
          },
          {
            label: this.translate.instant('REPORTS.CHART.REVENUE'),
            data: data.revenue,
            backgroundColor: t.primary,
            yAxisID: 'yIngresos',
            borderRadius: 4,
            barPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: t.text, usePointStyle: true, pointStyle: 'rect' }
          },
          tooltip: {
            backgroundColor: t.card,
            titleColor: t.textStrong,
            bodyColor: t.text,
            borderColor: t.grid,
            borderWidth: 1,
            padding: 12,
            titleFont: { weight: 'bold' },
            callbacks: {
              label: (ctx) => {
                const isRevenue = ctx.dataset.label === this.translate.instant('REPORTS.CHART.REVENUE');
                const value = isRevenue ? this.cop(ctx.parsed.y ?? 0) : (ctx.parsed.y ?? 0);
                return `${ctx.dataset.label}: ${value}`;
              }
            }
          }
        },
        scales: {
          yServicios: {
            beginAtZero: true,
            position: 'left',
            grid: { color: t.grid },
            ticks: { color: t.muted }
          },
          yIngresos: {
            beginAtZero: true,
            position: 'left',
            display: false,
            grid: { display: false },
            ticks: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { color: t.text }
          }
        }
      }
    });
  }

  /* ---------- ranking de servicios más vendidos ---------- */

  // frecuencia de cada servicio en el último mes (reservas no canceladas)
  get topServices(): { name: string; sales: number; percentage: number; color: string }[] {
    const counts = new Map<string, number>();
    const start = this.isoDaysAgo(29);

    this.reservations.bookings()
      .filter(b => b.date >= start && b.status !== 'cancelled')
      .forEach(b => counts.set(b.service, (counts.get(b.service) ?? 0) + 1));

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const max = sorted.length ? sorted[0][1] : 0;

    return sorted.map(([name, sales], i) => ({
      name,
      sales,
      percentage: max ? Math.round((sales / max) * 100) : 0,
      color: RANKING_COLORS[i % RANKING_COLORS.length],
    }));
  }

  // anima las barras de progreso de "servicios más vendidos" de 0 hasta su valor real
  private animateBars(): void {
    const bars = this.topServicesEl?.nativeElement.querySelectorAll<HTMLElement>('.ranking-fill');
    bars?.forEach(bar => {
      const target = bar.dataset['target'] ?? '0';
      requestAnimationFrame(() => {
        bar.style.width = target + '%';
      });
    });
  }

  /* ---------- exportación ---------- */

  // abre el modal de exportación con la vista previa del reporte
  openExportModal(): void {
    this.dialog.open(ExportReportModalComponent, {
      panelClass: 'custom-dialog',
      data: {
        dayReport: this.dayReport,
        weekReport: this.weekReport,
        monthReport: this.monthReport,
        yearRevenue: this.yearRevenue,
        topServices: this.topServices
      }
    });
  }
}