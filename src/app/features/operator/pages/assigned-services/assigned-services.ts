import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ServicioAsignado } from '../../models/servicio-asignado.model';
import { AssignedServicesViewModel } from './assigned-services.viewmodel';

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
  providers: [AssignedServicesViewModel],
  templateUrl: './assigned-services.html',
  styleUrl: './assigned-services.scss'
})
export class AssignedServicesComponent implements OnInit {

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

  constructor(public vm: AssignedServicesViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }

  // se ejecuta cuando el usuario selecciona un servicio en la tabla
  onServiceSelected(servicio: ServicioAsignado): void {
    this.vm.seleccionarServicio(servicio);
  }

  // filtra los servicios según los filtros activos
  get serviciosFiltrados() {
    return this.vm.servicios().filter(s => {
      if (this.filtroTipoServicio && s.tipoServicio !== this.filtroTipoServicio) return false;
      return true;
    });
  }
}