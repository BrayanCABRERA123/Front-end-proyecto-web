// definimos el componente
import { Component, AfterViewInit, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart } from 'chart.js/auto';
// modal de exportación de reportes
import { ExportReportModalComponent } from '../../../../shared/dialogs/export-report-modal/export-report-modal';
import { AdminReportsService } from '../../../../core/services/admin-reports';

// colores alternados del ranking (solo presentación)
const RANKING_COLORS = ['#2ec4b6', '#3b82f6'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, MatDialogModule, TranslateModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rankingCard') topServicesEl!: ElementRef<HTMLDivElement>;

  private chart?: Chart;

  // todo lo calcula el mock (GET /admin/reports): servicios = reservas completadas,
  // ingresos = pagos aprobados, semana de lunes a domingo
  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  servicesPerDay: number[] = [];
  revenuePerDay: number[] = [];

  // tarjetas de reporte
  dayReport = { services: 0, revenue: 0 };
  weekReport = { services: 0, revenue: 0 };
  monthReport = { services: 0, revenue: 0 };

  // ingresos totales del año
  yearRevenue = 0;

  // ranking de servicios más vendidos
  topServices: { name: string; sales: number; percentage: number; color: string }[] = [];

  private viewReady = false;
  private dataReady = false;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private reportsService: AdminReportsService
  ) {}

  ngOnInit(): void {
    this.reportsService.get$().subscribe(r => {
      this.days = r.days;
      this.servicesPerDay = r.servicesPerDay;
      this.revenuePerDay = r.revenuePerDay;
      this.dayReport = r.dayReport;
      this.weekReport = r.weekReport;
      this.monthReport = r.monthReport;
      this.yearRevenue = r.yearRevenue;
      this.topServices = r.topServices.map((s, i) => ({ ...s, color: RANKING_COLORS[i % RANKING_COLORS.length] }));
      this.dataReady = true;
      this.renderWhenReady();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderWhenReady();
  }

  // la gráfica necesita el <canvas> (vista) y los datos (mock): se dibuja cuando están ambos
  private renderWhenReady(): void {
    if (!this.viewReady || !this.dataReady) return;

    this.chart?.destroy();
    this.createChart();
    // pequeño retraso para que el ranking ya esté pintado (0%) antes de animar
    setTimeout(() => this.animateBars(), 100);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  // crea la gráfica de barras con tooltip personalizado y animación de entrada
  private createChart(): void {
    const labels = this.days.map(d => this.translate.instant('REPORTS.DAYS.' + d));

    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: this.translate.instant('REPORTS.CHART.SERVICES'),
            data: this.servicesPerDay,
            backgroundColor: '#0f5a52',
            yAxisID: 'yServicios',
            borderRadius: 4,
            barPercentage: 0.5
          },
          {
            label: this.translate.instant('REPORTS.CHART.REVENUE'),
            data: this.revenuePerDay,
            backgroundColor: '#5eead4',
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
            labels: { color: '#5f6f75', usePointStyle: true, pointStyle: 'rect' }
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1a1a2e',
            bodyColor: '#2ec4b6',
            borderColor: '#e6eaea',
            borderWidth: 1,
            padding: 12,
            titleFont: { weight: 'bold' },
            callbacks: {
              label: (ctx) => {
                const value = ctx.dataset.label === this.translate.instant('REPORTS.CHART.REVENUE')
                  ? '$' + ctx.parsed.y
                  : ctx.parsed.y;
                return `${ctx.dataset.label}: ${value}`;
              }
            }
          }
        },
        scales: {
          yServicios: {
            beginAtZero: true,
            position: 'left',
            grid: { color: '#eef2f2' },
            ticks: { color: '#8a9aa3' }
          },
          yIngresos: {
            beginAtZero: true,
            position: 'left',
            display: true,
            grid: { display: false },
            ticks: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#5f6f75' }
          }
        }
      }
    });
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
