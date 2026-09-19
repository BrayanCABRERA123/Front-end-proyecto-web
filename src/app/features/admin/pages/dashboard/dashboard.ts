import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';

// un día de la gráfica de ingresos
interface RevenueDay { day: string; amount: number; label: string; isToday?: boolean; }

// tarjeta de operario en el resumen de estado
interface OperatorStatus {
  initials: string;
  name: string;
  role: string;
  status: 'busy' | 'available' | 'leave';
  bay: string;
}

// pago con comprobante pendiente por verificar
interface PendingPayment {
  client: string;
  bank: string;
  bankClass: string;
  service: string;
  reference: string;
  amount: number;
}

// reserva confirmada que todavía no tiene operario asignado
interface UnassignedBooking {
  time: string;
  bay: string;
  client: string;
  vehicle: string;
  service: string;
  isUpcoming?: boolean;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {

  adminName = 'Laura';

  today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  stats = {
    bookingsToday: 18,
    vsYesterday: 3,
    servicesInProgress: 4,
    activeBays: 4,
    pendingPayments: 5,
    revenueToday: 680000,
  };

  weeklyRevenue: RevenueDay[] = [
    { day: 'Lun', amount: 520000, label: '$520k' },
    { day: 'Mar', amount: 610000, label: '$610k' },
    { day: 'Mié', amount: 450000, label: '$450k' },
    { day: 'Jue', amount: 680000, label: '$680k', isToday: true },
    { day: 'Vie', amount: 790000, label: '$790k' },
    { day: 'Sáb', amount: 1100000, label: '$1.1M' },
    { day: 'Dom', amount: 670000, label: '$670k' },
  ];

  operators: OperatorStatus[] = [
    { initials: 'JD', name: 'Juan Díaz', role: 'Lavador Especialista', status: 'busy', bay: 'Bahía 2' },
    { initials: 'CR', name: 'Carlos Ruiz', role: 'Técnico Detailing', status: 'available', bay: '' },
    { initials: 'MG', name: 'Mateo Gómez', role: 'Tapicería e Interiores', status: 'leave', bay: '' },
  ];

  pendingPayments: PendingPayment[] = [
    { client: 'Andrés Morales', bank: 'Bancolombia', bankClass: 'bancolombia', service: 'Lavado Detallado + Encerado', reference: '#BC-98402', amount: 85000 },
    { client: 'Carolina Vega', bank: 'Nequi', bankClass: 'nequi', service: 'Combo Completo SUV', reference: '#NQ-44129', amount: 120000 },
    { client: 'Felipe Montoya', bank: 'Daviplata', bankClass: 'daviplata', service: 'Lavado Básico Sedán', reference: '#DV-11208', amount: 45000 },
  ];

  unassignedBookings: UnassignedBooking[] = [
    { time: '15:00', bay: 'Bahía 3', client: 'Sofía Castro', vehicle: 'Mazda CX-30', service: 'Premium Especial', isUpcoming: true, icon: 'workspace_premium' },
    { time: '15:30', bay: 'Bahía 1', client: 'Diego Herrera', vehicle: 'Toyota Hilux', service: 'Desinfección + Tapicería', icon: 'sanitizer' },
    { time: '16:15', bay: 'Bahía 2', client: 'Mariana Gómez', vehicle: 'Renault Duster', service: 'Lavado General + Polichado', icon: 'auto_awesome' },
  ];

  get weekTotal(): number {
    return this.weeklyRevenue.reduce((sum, d) => sum + d.amount, 0);
  }

  get maxRevenue(): number {
    return Math.max(...this.weeklyRevenue.map(d => d.amount));
  }

  // altura de cada barra en % del máximo de la semana
  barHeight(amount: number): number {
    return Math.round((amount / this.maxRevenue) * 100);
  }

  // formatea a pesos colombianos, ej: $680.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  countByStatus(status: OperatorStatus['status']): number {
    return this.operators.filter(o => o.status === status).length;
  }
}
