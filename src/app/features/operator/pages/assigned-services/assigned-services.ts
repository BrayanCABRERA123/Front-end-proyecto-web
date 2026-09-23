import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Api } from '../../../../core/services/api';

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

  private readonly operatorId = 1;

  // estadísticas — label usa clave de traducción
  get stats() {
    return [
      { value: this.services.length, label: 'ASSIGNED_SERVICES.STATS.TOTAL', color: 'total' },
      { value: this.services.filter(s => s.statusColor === 'pending').length, label: 'ASSIGNED_SERVICES.STATS.PENDING', color: 'pending' },
      { value: this.services.filter(s => s.statusColor === 'progress').length, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS', color: 'progress' },
      { value: this.services.filter(s => s.statusColor === 'completed').length, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'completed' }
    ];
  }

  // filtros de búsqueda
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  vehicleFilter: string = '';

  serviceTypes = [
    { value: '',             label: 'ASSIGNED_SERVICES.FILTERS.ALL' },
    { value: 'basico',       label: 'SERVICE.BASIC' },
    { value: 'premium',      label: 'SERVICE.PREMIUM' },
    { value: 'completo',     label: 'SERVICE.FULL' },
    { value: 'desinfeccion', label: 'SERVICE.BASIC' }
  ];

  services: any[] = [];

  // servicio seleccionado para ver el detalle
  selectedService: any = null;

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getAssignedServices(this.operatorId).subscribe(services => {
      this.services = services;
      this.selectedService = services[0] ?? null;
      this.cdr.detectChanges();
    });
  }

  // se ejecuta cuando el usuario selecciona un servicio en la tabla
  onServiceSelected(service: any): void {
    this.selectedService = service;
  }

  // filtra los servicios según los filtros activos
  get filteredServices() {
    return this.services.filter(s => {
      if (this.serviceTypeFilter && s.serviceType !== this.serviceTypeFilter) return false;
      return true;
    });
  }
}
