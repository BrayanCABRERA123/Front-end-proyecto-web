import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ServiceTableComponent } from './components/service-table/service-table';
import { ServiceDetailComponent } from './components/service-detail/service-detail';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

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
export class AssignedServicesComponent {

  // estadísticas — label usa clave de traducción
  stats = [
    { value: 5, label: 'ASSIGNED_SERVICES.STATS.TOTAL',          color: 'total' },
    { value: 2, label: 'ASSIGNED_SERVICES.STATS.PENDING',        color: 'pending' },
    { value: 2, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS',    color: 'progress' },
    { value: 1, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'completed' }
  ];

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

  services = [
    {
      id: 'SV-2031',
      serviceType: 'Lavado básico',
      location: 'Calle Falsa 123, Spring...',
      fullAddress: 'Calle Falsa 123, Springfield',
      dateTime: '15/07/2026 - 10:00 AM',
      vehicle: 'Mazda 3 - ABC123',
      client: 'Juan Pérez',
      status: 'Pendiente',
      statusColor: 'pending',
      paymentMethod: 'Efectivo'
    },
    {
      id: 'SV-2032',
      serviceType: 'Lavado premium',
      location: 'Av. Siempre Viva 742, Sp...',
      fullAddress: 'Av. Siempre Viva 742, Springfield',
      dateTime: '15/07/2026 - 11:30 AM',
      vehicle: 'Toyota Corolla - DEF456',
      client: 'María García',
      status: 'En progreso',
      statusColor: 'progress',
      paymentMethod: 'Tarjeta'
    },
    {
      id: 'SV-2033',
      serviceType: 'Lavado + desinfección',
      location: 'Calle del Sol 10, Ciudad...',
      fullAddress: 'Calle del Sol 10, Ciudad',
      dateTime: '14/07/2026 - 03:00 PM',
      vehicle: 'Ford F-150 - GHI789',
      client: 'Empresa XYZ',
      status: 'Finalizado',
      statusColor: 'completed',
      paymentMethod: 'PSE'
    },
    {
      id: 'SV-2034',
      serviceType: 'Lavado completo',
      location: 'Blvd. Norte 456, Centro...',
      fullAddress: 'Blvd. Norte 456, Centro',
      dateTime: '16/07/2026 - 09:00 AM',
      vehicle: 'Honda Civic - JKL012',
      client: 'Ana López',
      status: 'Pendiente',
      statusColor: 'pending',
      paymentMethod: 'Nequi'
    },
    {
      id: 'SV-2035',
      serviceType: 'Lavado premium',
      location: 'Av. Libertad 89, Col. Ref...',
      fullAddress: 'Av. Libertad 89, Col. Reforma',
      dateTime: '16/07/2026 - 02:00 PM',
      vehicle: 'Nissan Sentra - MNO345',
      client: 'Carlos Ruiz',
      status: 'En progreso',
      statusColor: 'progress',
      paymentMethod: 'Efectivo'
    }
  ];

  // servicio seleccionado para ver el detalle
  selectedService: any = this.services[0];

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
