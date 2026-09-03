import { Component, OnInit } from '@angular/core';
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

  servicios: ServicioHistorial[] = [
    { id: 1, codigo: 'SV-1840', fecha: '2026-02-20', hora: '09:00', servicio: 'PREMIUM', vehiculo: 'CAR', placa: 'ABC-123', cliente: 'Laura Gómez', direccion: 'Cra. 45 #23-10, Chapinero', metodoPago: 'CARD', monto: 45000, calificacion: 5, comentario: 'Excelente servicio, muy puntual.', estado: 'finalizado', motivo: null },
    { id: 2, codigo: 'SV-1841', fecha: '2026-02-18', hora: '14:30', servicio: 'BASIC', vehiculo: 'MOTO', placa: 'XYZ-98D', cliente: 'Miguel Rojas', direccion: 'Cl. 80 #12-05, Usaquén', metodoPago: 'PSE', monto: 18000, calificacion: 4, comentario: null, estado: 'finalizado', motivo: null },
    { id: 3, codigo: 'SV-1842', fecha: '2026-02-15', hora: '10:30', servicio: 'FULL', vehiculo: 'TRUCK', placa: 'JKL-457', cliente: 'Andrea Salas', direccion: 'Av. Suba #100-20', metodoPago: 'CASH', monto: 38000, calificacion: 5, comentario: 'Todo perfecto.', estado: 'finalizado', motivo: null },
    { id: 4, codigo: 'SV-1843', fecha: '2026-02-14', hora: '11:15', servicio: 'PREMIUM', vehiculo: 'CAR', placa: 'MNO-741', cliente: 'Juan Díaz', direccion: 'Cra. 7 #45-12, Kennedy', metodoPago: 'CARD', monto: 45000, calificacion: null, comentario: null, estado: 'cancelado', motivo: 'El cliente canceló por lluvia.' },
    { id: 5, codigo: 'SV-1844', fecha: '2026-02-10', hora: '12:00', servicio: 'BASIC', vehiculo: 'TRUCK', placa: 'PQR-369', cliente: 'Camila Torres', direccion: 'Cl. 26 #68-30, Fontibón', metodoPago: 'NEQUI', monto: 22000, calificacion: null, comentario: null, estado: 'reasignado', motivo: 'Reasignado a otro operario por sobrecupo.' },
    { id: 6, codigo: 'SV-1845', fecha: '2026-02-08', hora: '08:45', servicio: 'FULL', vehiculo: 'CAR', placa: 'STU-852', cliente: 'Ricardo Nova', direccion: 'Cra. 15 #85-40, Teusaquillo', metodoPago: 'CARD', monto: 38000, calificacion: 5, comentario: 'Volveré a pedir el servicio.', estado: 'finalizado', motivo: null },
    { id: 7, codigo: 'SV-1846', fecha: '2026-02-05', hora: '16:00', servicio: 'PREMIUM', vehiculo: 'MOTO', placa: 'VWX-159', cliente: 'Sofía Herrera', direccion: 'Cl. 63 #24-18, Engativá', metodoPago: 'PSE', monto: 45000, calificacion: null, comentario: null, estado: 'cancelado', motivo: 'No se encontraba en la dirección registrada.' },
    { id: 8, codigo: 'SV-1847', fecha: '2026-02-02', hora: '10:00', servicio: 'BASIC', vehiculo: 'CAR', placa: 'YZA-753', cliente: 'Pedro López', direccion: 'Av. Boyacá #34-56, Suba', metodoPago: 'CASH', monto: 18000, calificacion: 4, comentario: null, estado: 'finalizado', motivo: null }
  ];

  constructor(private translate: TranslateService, private dialog: MatDialog) {}

  ngOnInit(): void {
    setTimeout(() => this.porcentajeAnimado = this.tasaCompletados, 150);
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