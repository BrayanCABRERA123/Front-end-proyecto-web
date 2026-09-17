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
      { valor: this.servicios.length, label: 'ASSIGNED_SERVICES.STATS.TOTAL', color: 'total' },
      { valor: this.servicios.filter(s => s.estadoColor === 'pendiente').length, label: 'ASSIGNED_SERVICES.STATS.PENDING', color: 'pendiente' },
      { valor: this.servicios.filter(s => s.estadoColor === 'progreso').length, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS', color: 'progreso' },
      { valor: this.servicios.filter(s => s.estadoColor === 'finalizado').length, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'finalizado' }
    ];
  }

  // filtros de búsqueda
  filtroFecha: string = '';
  filtroTipoServicio: string = '';
  filtroVehiculo: string = '';

  tiposServicio = [
    { value: '',             label: 'ASSIGNED_SERVICES.FILTERS.ALL' },
    { value: 'basico',       label: 'SERVICE.BASIC' },
    { value: 'premium',      label: 'SERVICE.PREMIUM' },
    { value: 'completo',     label: 'SERVICE.FULL' },
    { value: 'desinfeccion', label: 'SERVICE.BASIC' }
  ];

  servicios: any[] = [];

  // servicio seleccionado para ver el detalle
  servicioSeleccionado: any = null;

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getAssignedServices(this.operatorId).subscribe(servicios => {
      this.servicios = servicios;
      this.servicioSeleccionado = servicios[0] ?? null;
      this.cdr.detectChanges();
    });
  }

  // se ejecuta cuando el usuario selecciona un servicio en la tabla
  onServiceSelected(servicio: any): void {
    this.servicioSeleccionado = servicio;
  }

  // filtra los servicios según los filtros activos
  get serviciosFiltrados() {
    return this.servicios.filter(s => {
      if (this.filtroTipoServicio && s.tipoServicio !== this.filtroTipoServicio) return false;
      return true;
    });
  }
}