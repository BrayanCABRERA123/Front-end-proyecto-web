import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del operario
import { SidebarOperarioComponent } from '../../../../layout/sidebar-operario/sidebar-operario';
// importamos los componentes hijos
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-service-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarOperarioComponent,
    HistoryStatsComponent,
    HistoryTableComponent,
    MatIconModule
  ],
  templateUrl: './service-history.html',
  styleUrl: './service-history.scss'
})
export class ServiceHistoryComponent {

  // filtros de búsqueda
  filtroFecha: string = '';
  filtroTipoServicio: string = '';
  filtroEstado: string = '';

  // opciones de los selects
  tiposServicio = [
    { value: '', label: 'Todas' },
    { value: 'basico', label: 'Básico' },
    { value: 'premium', label: 'Premium' },
    { value: 'completo', label: 'Completo' }
  ];

  estados = [
    { value: '', label: 'Todos' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'reasignado', label: 'Reasignado' }
  ];

  // estadísticas del mes
  serviciosRealizados: number = 5;
  serviciosCancelados: number = 3;

  // lista de servicios del historial
  servicios = [
    {
      id: 'SV-1840',
      fechaCompletada: '20/02/2026 - 09:00',
      servicio: 'Premium',
      vehiculo: 'Automóvil',
      duracion: '50 min',
      estado: 'Finalizado',
      estadoColor: 'finalizado'
    },
    {
      id: 'SV-1841',
      fechaCompletada: '18/02/2026 - 14:30',
      servicio: 'Básico',
      vehiculo: 'Moto',
      duracion: '25 min',
      estado: 'Finalizado',
      estadoColor: 'finalizado'
    },
    {
      id: 'SV-1842',
      fechaCompletada: '15/02/2026 - 10:30',
      servicio: 'Completo',
      vehiculo: 'Camioneta',
      duracion: '45 min',
      estado: 'Finalizado',
      estadoColor: 'finalizado'
    },
    {
      id: 'SV-1843',
      fechaCompletada: '14/02/2026 - 11:15',
      servicio: 'Premium',
      vehiculo: 'Automóvil',
      duracion: '60 min',
      estado: 'Cancelado',
      estadoColor: 'cancelado'
    },
    {
      id: 'SV-1844',
      fechaCompletada: '10/02/2026 - 12:00',
      servicio: 'Básico',
      vehiculo: 'Camioneta',
      duracion: '75 min',
      estado: 'Reasignado',
      estadoColor: 'reasignado'
    },
    {
      id: 'SV-1845',
      fechaCompletada: '08/02/2026 - 08:45',
      servicio: 'Completo',
      vehiculo: 'Automóvil',
      duracion: '55 min',
      estado: 'Finalizado',
      estadoColor: 'finalizado'
    },
    {
      id: 'SV-1846',
      fechaCompletada: '05/02/2026 - 16:00',
      servicio: 'Premium',
      vehiculo: 'Moto',
      duracion: '30 min',
      estado: 'Cancelado',
      estadoColor: 'cancelado'
    },
    {
      id: 'SV-1847',
      fechaCompletada: '02/02/2026 - 10:00',
      servicio: 'Básico',
      vehiculo: 'Automóvil',
      duracion: '40 min',
      estado: 'Finalizado',
      estadoColor: 'finalizado'
    }
  ];

  // filtra los servicios según los filtros activos
  get serviciosFiltrados() {
    return this.servicios.filter(s => {
      if (this.filtroTipoServicio &&
          s.servicio.toLowerCase() !== this.filtroTipoServicio) return false;
      if (this.filtroEstado &&
          s.estadoColor !== this.filtroEstado) return false;
      return true;
    });
  }
}