// definimos el componente
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, MatDialogModule, TranslateModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class ReportsComponent implements AfterViewInit, OnDestroy {

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rankingCard') topServicesEl!: ElementRef<HTMLDivElement>;

  private chart?: Chart;

  // datos de la gráfica semanal (mock)
  days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  servicesPerDay = [12, 22, 18, 22, 15, 30, 25];
  revenuePerDay = [420, 700, 560, 920, 480, 1580, 1180];

  // tarjetas de reporte
  dayReport = { services: 15, revenue: 500 };
  weekReport = { services: 75, revenue: 2500 };
  monthReport = { services: 300, revenue: 10000 };

  // ingresos totales del año
  yearRevenue = 120000;

  // ranking de servicios más vendidos
  topServices = [
    { name: 'Lavado completo', sales: 120, percentage: 100, color: '#2ec4b6' },
    { name: 'Encerado premium', sales: 90, percentage: 75, color: '#3b82f6' },
    { name: 'Lavado básico', sales: 70, percentage: 58, color: '#2ec4b6' }
  ];

  constructor(private dialog: MatDialog, private translate: TranslateService) {}

  ngAfterViewInit(): void {
    this.createChart();
    // pequeño retraso para que el navegador aplique el estado inicial (0%) antes de animar
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
