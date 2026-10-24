// definimos el componente
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, effect, inject, untracked } from '@angular/core';
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
import { ReportPeriod, ReportsViewModel } from '../../viewmodels/reports.viewmodel';
import { keepFresh } from '../../../../core/services/live-refresh';

// vista de Reportes: los números están en ReportsViewModel; aquí quedan la gráfica (Chart.js),
// los colores del tema, la animación del ranking y la exportación
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, EmptyStateComponent, MatIconModule, MatDialogModule, TranslateModule],
  providers: [ReportsViewModel],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class ReportsComponent implements AfterViewInit, OnDestroy {

  readonly vm = inject(ReportsViewModel);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña y con cada notificación nueva
  constructor() {
    keepFresh(silent => this.vm.load(silent));
    // WEB-04: la gráfica se arma una vez y se actualiza cuando llegan (o cambian) los datos o el
    // periodo; antes se quedaba con lo que había al abrir la pantalla (casi siempre, vacío)
    effect(() => {
      const data = this.vm.chartData;
      untracked(() => this.updateChart(data));
    });
  }

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  periods: ReportPeriod[] = ['day', 'week', 'month'];

  // una sola gráfica por pantalla: después solo se actualizan sus datos
  ngAfterViewInit(): void {
    if (!this.chart) this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // el effect del constructor actualiza la gráfica con el periodo nuevo
  changePeriod(period: ReportPeriod): void {
    if (this.vm.period() === period) return;
    this.vm.setPeriod(period);
  }

  /** pone en la gráfica ya creada las etiquetas y los valores nuevos (sin crearla otra vez) */
  private updateChart(data: { labels: string[]; services: number[]; revenue: number[] }): void {
    const chart = this.chart;
    if (!chart) return;
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.services;
    chart.data.datasets[1].data = data.revenue;
    chart.update();
  }

  // servicios más pedidos con el color del tema de cada posición
  get topServices(): { name: string; sales: number; percentage: number; color: string }[] {
    return this.vm.topServices.map((service, i) => ({ ...service, color: this.rankingColor(i) }));
  }

  // colores del tema actual (claro u oscuro) leídos de las variables CSS
  private cssVar(name: string, fallback: string): string {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
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
      chartA: this.cssVar('--chart-1', '#2ec4b6'),
      chartB: this.cssVar('--chart-2', '#1fa89c'),
      chartC: this.cssVar('--chart-3', '#0f7a72'),
    };
  }

  // color del ranking según el tema activo (barras de servicios más vendidos)
  private rankingColor(index: number): string {
    const t = this.theme();
    const colors = [t.chartA, t.chartB, t.chartC];
    return colors[index % colors.length];
  }

  // crea la gráfica de barras con tooltip personalizado y animación de entrada
  private createChart(): void {
    const t = this.theme();
    const data = this.vm.chartData;

    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: this.translate.instant('REPORTS.CHART.SERVICES'),
            data: data.services,
            backgroundColor: t.chartB,
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

  /* ---------- exportación ---------- */

  // abre el modal de exportación con la vista previa del reporte
  openExportModal(): void {
    this.dialog.open(ExportReportModalComponent, {
      panelClass: 'custom-dialog',
      data: {
        dayReport: this.vm.dayReport,
        weekReport: this.vm.weekReport,
        monthReport: this.vm.monthReport,
        yearRevenue: this.vm.yearRevenue,
        topServices: this.topServices
      }
    });
  }
}
