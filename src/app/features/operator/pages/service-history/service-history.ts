import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryStatsComponent } from './components/history-stats/history-stats';
import { HistoryTableComponent } from './components/history-table/history-table';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ServiceHistoryDetailModal } from '../../../../shared/dialogs/service-history-detail-modal/service-history-detail-modal';
import { ServicioHistorial } from '../../../../shared/dialogs/history-models/service-history.model';
import { Api } from '../../../../core/services/api';

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

  tabActiva: Tab = 'todos';
  busqueda = '';
  filtroFecha = '';
  filtroServicio = '';

  tiposServicio = ['BASIC', 'PREMIUM', 'FULL'];

  porcentajeAnimado = 0;

  servicios: ServicioHistorial[] = [];

  private readonly operatorId = 1;

  constructor(private translate: TranslateService, private dialog: MatDialog, private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getOperatorServiceHistory(this.operatorId).subscribe(servicios => {
      this.servicios = servicios;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.porcentajeAnimado = this.tasaCompletados;
        this.cdr.detectChanges();
      }, 150);
    });
  }

  get finalizados(): number {
    return this.servicios.filter(s => s.estado === 'finalizado').length;
  }

  get canceladosReasignados(): number {
    return this.servicios.filter(s => s.estado !== 'finalizado').length;
  }

  get totalGenerado(): number {
    return this.servicios
      .filter(s => s.estado === 'finalizado')
      .reduce((sum, s) => sum + s.monto, 0);
  }

  get calificacionPromedio(): number {
    const calificadas = this.servicios.filter(s => s.calificacion !== null);
    if (calificadas.length === 0) return 0;
    const suma = calificadas.reduce((sum, s) => sum + (s.calificacion ?? 0), 0);
    return Math.round((suma / calificadas.length) * 10) / 10;
  }

  get tasaCompletados(): number {
    if (this.servicios.length === 0) return 0;
    return Math.round((this.finalizados / this.servicios.length) * 100);
  }

  contarTab(tab: Tab): number {
    if (tab === 'todos') return this.servicios.length;
    return this.servicios.filter(s => s.estado === tab).length;
  }

  cambiarTab(tab: Tab) {
    this.tabActiva = tab;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroFecha = '';
    this.filtroServicio = '';
    this.tabActiva = 'todos';
  }

  get serviciosFiltrados(): ServicioHistorial[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.servicios.filter(s => {
      if (this.tabActiva !== 'todos' && s.estado !== this.tabActiva) return false;
      if (this.filtroFecha && s.fecha !== this.filtroFecha) return false;
      if (this.filtroServicio && s.servicio !== this.filtroServicio) return false;

      if (texto) {
        const vehiculoTraducido = this.translate.instant('VEHICLE.' + s.vehiculo).toLowerCase();
        const servicioTraducido = this.translate.instant('SERVICE.' + s.servicio).toLowerCase();
        const coincide =
          s.codigo.toLowerCase().includes(texto) ||
          s.placa.toLowerCase().includes(texto) ||
          s.cliente.toLowerCase().includes(texto) ||
          vehiculoTraducido.includes(texto) ||
          servicioTraducido.includes(texto);
        if (!coincide) return false;
      }

      return true;
    });
  }

  verDetalle(servicio: ServicioHistorial) {
    this.dialog.open(ServiceHistoryDetailModal, {
      panelClass: 'custom-dialog',
      data: servicio
    });
  }
}