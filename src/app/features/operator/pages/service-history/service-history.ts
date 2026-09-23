import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ServiceHistoryDetailModal } from '../../../../shared/dialogs/service-history-detail-modal/service-history-detail-modal';
import { ServicioHistorial } from '../../../../shared/dialogs/history-models/service-history.model';
import { Api } from '../../../../core/services/api';

// estos 3 valores coinciden con EstadoHistorial (shared/dialogs/history-models), no se traducen aquí
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

  services: ServicioHistorial[] = [];

  private readonly operatorId = 1;

  constructor(private translate: TranslateService, private dialog: MatDialog, private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getOperatorServiceHistory(this.operatorId).subscribe(services => {
      this.services = services;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.animatedPercentage = this.completionRate;
        this.cdr.detectChanges();
      }, 150);
    });
  }

  get completed(): number {
    return this.services.filter(s => s.estado === 'finalizado').length;
  }

  get canceledOrReassigned(): number {
    return this.services.filter(s => s.estado !== 'finalizado').length;
  }

  get totalGenerated(): number {
    return this.services
      .filter(s => s.estado === 'finalizado')
      .reduce((sum, s) => sum + s.monto, 0);
  }

  get averageRating(): number {
    const rated = this.services.filter(s => s.calificacion !== null);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((total, s) => total + (s.calificacion ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }

  get completionRate(): number {
    if (this.services.length === 0) return 0;
    return Math.round((this.completed / this.services.length) * 100);
  }

  countTab(tab: Tab): number {
    if (tab === 'todos') return this.services.length;
    return this.services.filter(s => s.estado === tab).length;
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

  get filteredServices(): ServicioHistorial[] {
    const text = this.search.trim().toLowerCase();

    return this.services.filter(s => {
      if (this.activeTab !== 'todos' && s.estado !== this.activeTab) return false;
      if (this.dateFilter && s.fecha !== this.dateFilter) return false;
      if (this.serviceFilter && s.servicio !== this.serviceFilter) return false;

      if (text) {
        const translatedVehicle = this.translate.instant('VEHICLE.' + s.vehiculo).toLowerCase();
        const translatedService = this.translate.instant('SERVICE.' + s.servicio).toLowerCase();
        const matches =
          s.codigo.toLowerCase().includes(text) ||
          s.placa.toLowerCase().includes(text) ||
          s.cliente.toLowerCase().includes(text) ||
          translatedVehicle.includes(text) ||
          translatedService.includes(text);
        if (!matches) return false;
      }

      return true;
    });
  }

  viewDetail(service: ServicioHistorial) {
    this.dialog.open(ServiceHistoryDetailModal, {
      panelClass: 'custom-dialog',
      data: service
    });
  }
}
