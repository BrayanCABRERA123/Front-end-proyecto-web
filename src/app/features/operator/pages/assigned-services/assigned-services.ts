import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { Reservation } from '../../../../shared/dialogs/reservation-models/reservation.model';
import { OperatorWorkService } from '../../../../core/services/operator-work';

@Component({
  selector: 'app-assigned-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ServiceTableComponent,
    ServiceDetailComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './assigned-services.html',
  styleUrl: './assigned-services.scss'
})
export class AssignedServicesComponent implements OnInit {

  // estadísticas (calculadas por el mock) — label usa clave de traducción
  stats = [
    { value: 0, label: 'ASSIGNED_SERVICES.STATS.TOTAL',           color: 'total' },
    { value: 0, label: 'ASSIGNED_SERVICES.STATS.PENDING',         color: 'pending' },
    { value: 0, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS',     color: 'progress' },
    { value: 0, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'completed' }
  ];

  // filtros que el usuario va editando
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  vehicleFilter: string = '';

  // filtros aplicados al pulsar "Filtrar"
  private applied = { date: '', type: '', vehicle: '' };

  // códigos del catálogo (services.code), se traducen con SERVICE.*
  serviceTypes = [
    { value: '',        label: 'ASSIGNED_SERVICES.FILTERS.ALL' },
    { value: 'BASIC',   label: 'SERVICE.BASIC' },
    { value: 'PREMIUM', label: 'SERVICE.PREMIUM' },
    { value: 'FULL',    label: 'SERVICE.FULL' }
  ];

  // servicios asignados al operario autenticado (GET /me/operator/services)
  services: Reservation[] = [];

  // servicio seleccionado para ver el detalle
  selectedService: Reservation | null = null;

  constructor(
    private operatorWork: OperatorWorkService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.operatorWork.services$().subscribe(({ stats, items }) => {
      this.stats[0].value = stats.total;
      this.stats[1].value = stats.pending;
      this.stats[2].value = stats.inProgress;
      this.stats[3].value = stats.completedToday;

      // lo que está por hacer primero; lo finalizado al final
      this.services = [
        ...items.filter(s => s.status !== 'finalizado'),
        ...items.filter(s => s.status === 'finalizado').reverse()
      ];

      // conserva la selección tras recargar; si no hay, toma el primero
      this.selectedService = this.services.find(s => s.id === this.selectedService?.id) ?? this.services[0] ?? null;
      this.cdr.markForCheck();
    });
  }

  // se ejecuta cuando el usuario selecciona un servicio en la tabla
  onServiceSelected(service: Reservation): void {
    this.selectedService = service;
  }

  applyFilters(): void {
    this.applied = { date: this.dateFilter, type: this.serviceTypeFilter, vehicle: this.vehicleFilter.trim().toLowerCase() };
  }

  resetFilters(): void {
    this.dateFilter = '';
    this.serviceTypeFilter = '';
    this.vehicleFilter = '';
    this.applyFilters();
  }

  // filtra los servicios según los filtros aplicados
  get filteredServices(): Reservation[] {
    return this.services.filter(s => {
      if (this.applied.date && s.date !== this.applied.date) return false;
      if (this.applied.type && s.service !== this.applied.type) return false;
      if (this.applied.vehicle) {
        const text = `${s.vehicleName ?? ''} ${s.plate ?? ''}`.toLowerCase();
        if (!text.includes(this.applied.vehicle)) return false;
      }
      return true;
    });
  }

  startService(service: Reservation): void {
    this.operatorWork.start$(service.id).subscribe(() => this.load());
  }

  finishService(service: Reservation): void {
    const data: ConfirmModalData = {
      title: 'SCHEDULE.FINISH_TITLE',
      message: 'SCHEDULE.FINISH_MESSAGE',
      confirmText: 'SCHEDULE.FINISH_CONFIRM',
      cancelText: 'COMMON.CANCEL',
      danger: false
    };

    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.operatorWork.finish$(service.id).subscribe(() => this.load());
    });
  }
}
