import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ServiceHistoryDetailModal } from '../../../../shared/dialogs/service-history-detail-modal/service-history-detail-modal';
import { ServiceHistoryItem } from '../../../../shared/dialogs/history-models/service-history.model';
import { ServiceHistoryViewModel } from '../../viewmodels/service-history.viewmodel';

// vista del Historial: el estado y los filtros están en ServiceHistoryViewModel
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
  providers: [ServiceHistoryViewModel],
  templateUrl: './service-history.html',
  styleUrl: './service-history.scss'
})
export class ServiceHistoryComponent implements OnInit {

  readonly vm = inject(ServiceHistoryViewModel);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.vm.load();
  }

  viewDetail(service: ServiceHistoryItem) {
    this.dialog.open(ServiceHistoryDetailModal, {
      panelClass: 'custom-dialog',
      data: service
    });
  }
}
