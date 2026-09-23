import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { OperatorWorkService } from '../../../../core/services/operator-work';

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

  // servicios cerrados del operario autenticado (GET /me/operator/history)
  services: ServiceHistoryItem[] = [];

  // indicadores calculados por el mock API
  completed = 0;
  canceledOrReassigned = 0;
  totalGenerated = 0;
  averageRating = 0;
  completionRate = 0;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private operatorWork: OperatorWorkService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.operatorWork.history$().subscribe(({ stats, items }) => {
      this.services = items;
      this.completed = stats.completed;
      this.canceledOrReassigned = stats.canceledOrReassigned;
      this.totalGenerated = stats.totalGenerated;
      this.averageRating = stats.averageRating;
      this.completionRate = stats.completionRate;
      this.cdr.markForCheck();

      // la barra arranca en 0 y se anima hasta el porcentaje real
      setTimeout(() => {
        this.animatedPercentage = this.completionRate;
        this.cdr.markForCheck();
      }, 150);
    });
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
