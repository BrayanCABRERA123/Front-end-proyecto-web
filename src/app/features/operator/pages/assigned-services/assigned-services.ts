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
    { valor: 5, label: 'ASSIGNED_SERVICES.STATS.TOTAL',          color: 'total' },
    { valor: 2, label: 'ASSIGNED_SERVICES.STATS.PENDING',        color: 'pendiente' },
    { valor: 2, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS',    color: 'progreso' },
    { valor: 1, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'finalizado' }
  ];

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

  servicios = [
    {
      id: 'SV-2031',
      tipoServicio: 'Lavado básico',
      ubicacion: 'Calle Falsa 123, Spring...',
      ubicacionCompleta: 'Calle Falsa 123, Springfield',
      fechaHora: '15/07/2026 - 10:00 AM',
      vehiculo: 'Mazda 3 - ABC123',
      client: 'Juan Pérez',
      estado: 'Pendiente',
      estadoColor: 'pendiente',
      metodoPago: 'Efectivo'
    },
    {
      id: 'SV-2032',
      tipoServicio: 'Lavado premium',
      ubicacion: 'Av. Siempre Viva 742, Sp...',
      ubicacionCompleta: 'Av. Siempre Viva 742, Springfield',
      fechaHora: '15/07/2026 - 11:30 AM',
      vehiculo: 'Toyota Corolla - DEF456',
      client: 'María García',
      estado: 'En progreso',
      estadoColor: 'progreso',
      metodoPago: 'Tarjeta'
    },
    {
      id: 'SV-2033',
      tipoServicio: 'Lavado + desinfección',
      ubicacion: 'Calle del Sol 10, Ciudad...',
      ubicacionCompleta: 'Calle del Sol 10, Ciudad',
      fechaHora: '14/07/2026 - 03:00 PM',
      vehiculo: 'Ford F-150 - GHI789',
      client: 'Empresa XYZ',
      estado: 'Finalizado',
      estadoColor: 'finalizado',
      metodoPago: 'PSE'
    },
    {
      id: 'SV-2034',
      tipoServicio: 'Lavado completo',
      ubicacion: 'Blvd. Norte 456, Centro...',
      ubicacionCompleta: 'Blvd. Norte 456, Centro',
      fechaHora: '16/07/2026 - 09:00 AM',
      vehiculo: 'Honda Civic - JKL012',
      client: 'Ana López',
      estado: 'Pendiente',
      estadoColor: 'pendiente',
      metodoPago: 'Nequi'
    },
    {
      id: 'SV-2035',
      tipoServicio: 'Lavado premium',
      ubicacion: 'Av. Libertad 89, Col. Ref...',
      ubicacionCompleta: 'Av. Libertad 89, Col. Reforma',
      fechaHora: '16/07/2026 - 02:00 PM',
      vehiculo: 'Nissan Sentra - MNO345',
      client: 'Carlos Ruiz',
      estado: 'En progreso',
      estadoColor: 'progreso',
      metodoPago: 'Efectivo'
    }
  ];

  // servicio seleccionado para ver el detalle
  servicioSeleccionado: any = this.servicios[0];

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