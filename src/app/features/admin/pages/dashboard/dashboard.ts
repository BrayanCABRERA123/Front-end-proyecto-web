import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { AdminDashboard, AdminDashboardService } from '../../../../core/services/admin-dashboard';

type OperatorStatus = AdminDashboard['operators'][number]['status'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {

  adminName = '';

  today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // todo lo de abajo lo calcula el mock (GET /admin/dashboard)
  stats: AdminDashboard['stats'] = {
    bookingsToday: 0,
    vsYesterday: 0,
    servicesInProgress: 0,
    activeBays: 0,
    pendingPayments: 0,
    revenueToday: 0,
  };

  weeklyRevenue: AdminDashboard['weeklyRevenue'] = [];
  weekTotal = 0;
  peakDay: string | null = null;
  operators: AdminDashboard['operators'] = [];
  pendingPayments: AdminDashboard['pendingPayments'] = [];
  unassignedBookings: AdminDashboard['unassignedBookings'] = [];
  unassignedCount = 0;

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.get$().subscribe(d => {
      this.adminName = d.adminName;
      this.stats = d.stats;
      this.weeklyRevenue = d.weeklyRevenue;
      this.weekTotal = d.weekTotal;
      this.peakDay = d.peakDay;
      this.operators = d.operators;
      this.pendingPayments = d.pendingPayments;
      this.unassignedBookings = d.unassignedBookings;
      this.unassignedCount = d.unassignedCount;
    });
  }

  get maxRevenue(): number {
    return Math.max(0, ...this.weeklyRevenue.map(d => d.amount));
  }

  // altura de cada barra en % del máximo de la semana (semana sin ingresos = barras vacías)
  barHeight(amount: number): number {
    return this.maxRevenue ? Math.round((amount / this.maxRevenue) * 100) : 0;
  }

  // formatea a pesos colombianos, ej: $680.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  countByStatus(status: OperatorStatus): number {
    return this.operators.filter(o => o.status === status).length;
  }
}
