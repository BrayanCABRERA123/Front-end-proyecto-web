import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceHistoryViewModel } from './service-history.viewmodel';

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

  // filtros de búsqueda
  filtroFecha: string = '';
  filtroTipoServicio: string = '';
  filtroEstado: string = '';

  // opciones de los selects
  tiposServicio = [
    { value: '', label: 'SERVICE_HISTORY.TYPE_ALL' },
    { value: 'básico', label: 'SERVICE_HISTORY.TYPE_BASIC' },
    { value: 'premium', label: 'SERVICE_HISTORY.TYPE_PREMIUM' },
    { value: 'completo', label: 'SERVICE_HISTORY.TYPE_FULL' }
  ];

  estados = [
    { value: '', label: 'SERVICE_HISTORY.STATUS_ALL' },
    { value: 'finalizado', label: 'SERVICE_HISTORY.STATUS_FINISHED' },
    { value: 'cancelado', label: 'SERVICE_HISTORY.STATUS_CANCELED' },
    { value: 'reasignado', label: 'SERVICE_HISTORY.STATUS_REASSIGNED' }
  ];

  constructor(public vm: ServiceHistoryViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }

  // filtra los servicios según los filtros activos
  get serviciosFiltrados() {
    return this.vm.servicios().filter(s => {
      if (this.filtroTipoServicio &&
          s.servicio.toLowerCase() !== this.filtroTipoServicio) return false;
      if (this.filtroEstado &&
          s.estadoColor !== this.filtroEstado) return false;
      return true;
    });
  }
}