import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ServiceHistoryDetailModal } from '../../../../shared/dialogs/service-history-detail-modal/service-history-detail-modal';
import { ServiceHistoryItem } from '../../../../shared/dialogs/history-models/service-history.model';

// estos 3 valores coinciden con HistoryStatus (shared/dialogs/history-models), no se traducen aquí
type Tab = 'todos' | 'finalizado' | 'cancelado' | 'reasignado';

@Component({
  selector: 'app-service-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HistoryStatsComponent,
    HistoryTableComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './service-history.html',
  styleUrl: './service-history.scss'
})
export class ServiceHistoryComponent implements OnInit {

  activeTab: Tab = 'todos';
  search = '';
  dateFilter = '';
  serviceFilter = '';

  serviceTypes = ['BASIC', 'PREMIUM', 'FULL'];

  animatedPercentage = 0;

  services: ServiceHistoryItem[] = [
    { id: 1, code: 'SV-1840', date: '2026-02-20', time: '09:00', service: 'PREMIUM', vehicle: 'CAR', plate: 'ABC-123', client: 'Laura Gómez', address: 'Cra. 45 #23-10, Chapinero', paymentMethod: 'CARD', amount: 45000, rating: 5, comment: 'Excelente servicio, muy puntual.', status: 'finalizado', reason: null },
    { id: 2, code: 'SV-1841', date: '2026-02-18', time: '14:30', service: 'BASIC', vehicle: 'MOTO', plate: 'XYZ-98D', client: 'Miguel Rojas', address: 'Cl. 80 #12-05, Usaquén', paymentMethod: 'PSE', amount: 18000, rating: 4, comment: null, status: 'finalizado', reason: null },
    { id: 3, code: 'SV-1842', date: '2026-02-15', time: '10:30', service: 'FULL', vehicle: 'TRUCK', plate: 'JKL-457', client: 'Andrea Salas', address: 'Av. Suba #100-20', paymentMethod: 'CASH', amount: 38000, rating: 5, comment: 'Todo perfecto.', status: 'finalizado', reason: null },
    { id: 4, code: 'SV-1843', date: '2026-02-14', time: '11:15', service: 'PREMIUM', vehicle: 'CAR', plate: 'MNO-741', client: 'Juan Díaz', address: 'Cra. 7 #45-12, Kennedy', paymentMethod: 'CARD', amount: 45000, rating: null, comment: null, status: 'cancelado', reason: 'El cliente canceló por lluvia.' },
    { id: 5, code: 'SV-1844', date: '2026-02-10', time: '12:00', service: 'BASIC', vehicle: 'TRUCK', plate: 'PQR-369', client: 'Camila Torres', address: 'Cl. 26 #68-30, Fontibón', paymentMethod: 'NEQUI', amount: 22000, rating: null, comment: null, status: 'reasignado', reason: 'Reasignado a otro operario por sobrecupo.' },
    { id: 6, code: 'SV-1845', date: '2026-02-08', time: '08:45', service: 'FULL', vehicle: 'CAR', plate: 'STU-852', client: 'Ricardo Nova', address: 'Cra. 15 #85-40, Teusaquillo', paymentMethod: 'CARD', amount: 38000, rating: 5, comment: 'Volveré a pedir el servicio.', status: 'finalizado', reason: null },
    { id: 7, code: 'SV-1846', date: '2026-02-05', time: '16:00', service: 'PREMIUM', vehicle: 'MOTO', plate: 'VWX-159', client: 'Sofía Herrera', address: 'Cl. 63 #24-18, Engativá', paymentMethod: 'PSE', amount: 45000, rating: null, comment: null, status: 'cancelado', reason: 'No se encontraba en la dirección registrada.' },
    { id: 8, code: 'SV-1847', date: '2026-02-02', time: '10:00', service: 'BASIC', vehicle: 'CAR', plate: 'YZA-753', client: 'Pedro López', address: 'Av. Boyacá #34-56, Suba', paymentMethod: 'CASH', amount: 18000, rating: 4, comment: null, status: 'finalizado', reason: null }
  ];

  constructor(private translate: TranslateService, private dialog: MatDialog) {}

  ngOnInit(): void {
    setTimeout(() => this.animatedPercentage = this.completionRate, 150);
  }

  get completed(): number {
    return this.services.filter(s => s.status === 'finalizado').length;
  }

  get canceledOrReassigned(): number {
    return this.services.filter(s => s.status !== 'finalizado').length;
  }

  get totalGenerated(): number {
    return this.services
      .filter(s => s.status === 'finalizado')
      .reduce((sum, s) => sum + s.amount, 0);
  }

  get averageRating(): number {
    const rated = this.services.filter(s => s.rating !== null);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((total, s) => total + (s.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }

  get completionRate(): number {
    if (this.services.length === 0) return 0;
    return Math.round((this.completed / this.services.length) * 100);
  }

  countTab(tab: Tab): number {
    if (tab === 'todos') return this.services.length;
    return this.services.filter(s => s.status === tab).length;
  }

  changeTab(tab: Tab) {
    this.activeTab = tab;
  }

  clearFilters() {
    this.search = '';
    this.dateFilter = '';
    this.serviceFilter = '';
    this.activeTab = 'todos';
  }

  get filteredServices(): ServiceHistoryItem[] {
    const text = this.search.trim().toLowerCase();

    return this.services.filter(s => {
      if (this.activeTab !== 'todos' && s.status !== this.activeTab) return false;
      if (this.dateFilter && s.date !== this.dateFilter) return false;
      if (this.serviceFilter && s.service !== this.serviceFilter) return false;

      if (text) {
        const translatedVehicle = this.translate.instant('VEHICLE.' + s.vehicle).toLowerCase();
        const translatedService = this.translate.instant('SERVICE.' + s.service).toLowerCase();
        const matches =
          s.code.toLowerCase().includes(text) ||
          s.plate.toLowerCase().includes(text) ||
          s.client.toLowerCase().includes(text) ||
          translatedVehicle.includes(text) ||
          translatedService.includes(text);
        if (!matches) return false;
      }

      return true;
    });
  }

  viewDetail(service: ServiceHistoryItem) {
    this.dialog.open(ServiceHistoryDetailModal, {
      panelClass: 'custom-dialog',
      data: service
    });
  }
}
