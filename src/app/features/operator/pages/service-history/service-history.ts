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
// servicios que ya hizo (operations-service)
import { OperationsApiService, localIsoDate } from '../../../../core/services/operations-api';

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

  // nombres de servicio que aparecen en su historial (salen de los datos)
  get serviceTypes(): string[] {
    return [...new Set(this.services.map(s => s.service))];
  }

  animatedPercentage = 0;

  services: ServiceHistoryItem[] = [];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private operations: OperationsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  // servicios terminados de los últimos 60 días, con la calificación que dio el cliente
  ngOnInit(): void {
    const from = new Date();
    from.setDate(from.getDate() - 60);
    this.operations.myServices(localIsoDate(from), localIsoDate(new Date())).subscribe({
      next: list => {
        this.services = list
          .filter(s => s.status === 'COMPLETED')
          .map((s, i) => ({
            id: s.bookingId ?? i,
            code: s.code,
            date: s.date,
            time: s.startTime.slice(0, 5),
            service: s.services,
            vehicle: s.vehicle,
            plate: s.plate,
            client: s.plate,
            paymentMethod: '',
            amount: s.total,
            rating: s.rating,
            comment: s.comment,
            status: 'finalizado',
            reason: null
          } as ServiceHistoryItem));
        this.animatedPercentage = this.completionRate;
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
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
        // vehículo y servicio ya vienen con su nombre real desde el backend
        const matches =
          s.code.toLowerCase().includes(text) ||
          s.plate.toLowerCase().includes(text) ||
          s.client.toLowerCase().includes(text) ||
          (s.vehicle ?? '').toLowerCase().includes(text) ||
          (s.service ?? '').toLowerCase().includes(text);
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
