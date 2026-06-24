import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HistoryCardComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent {

  constructor(private translate: TranslateService) {}

  // filtro activo
  filtroActivo: string = 'todos';

  // fechas
  fechaDesde: string = '';
  fechaHasta: string = '';

  // buscador
  busqueda: string = '';

  mostrarModalCalificacion = false;

  abrirModalCalificacion(): void {
    this.mostrarModalCalificacion = true;
  }

  // SERVICIOS 
  servicios = [
  {
    id: 1,
    titulo: 'PREMIUM_CAR',
    fecha: '28/03/2026',
    direccion: 'Calle Falsa 123, Springfield',
    tipoServicio: 'FULL_WASH',
    serviciosExtra: ['WAX', 'VACUUM'],
    asignacionTipo: 'MANUAL',
    operador: 'Juan',
    estado: 'COMPLETED',
    precio: 35,
    pagado: true
  },
  {
    id: 2,
    titulo: 'BASIC_MOTO',
    fecha: '16/12/2025',
    direccion: 'Calle 42 #13-33',
    tipoServicio: 'FULL_WASH',
    serviciosExtra: ['WAX'],
    asignacionTipo: 'AUTO',
    operador: '',
    estado: 'PENDING',
    precio: 35,
    pagado: false
  }
];

  // TRADUCIR EXTRAS
  getExtrasTraducidos(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('EXTRA.' + e));
  }

  // FILTRO COMPLETO
  get serviciosFiltrados() {
    return this.servicios.filter(servicio => {

      // filtro por estado
      if (this.filtroActivo === 'pagados' && !servicio.pagado) return false;
      if (this.filtroActivo === 'pendientes' && servicio.pagado) return false;

      // filtro por texto
      if (this.busqueda) {
      const texto = this.busqueda.toLowerCase();

      return (
        servicio.direccion.toLowerCase().includes(texto) ||

        this.translate.instant('SERVICE.' + servicio.tipoServicio)
          .toLowerCase()
          .includes(texto) ||

        this.translate.instant('ASSIGNMENT.' + servicio.asignacionTipo)
          .toLowerCase()
          .includes(texto) ||

        (servicio.operador &&
          servicio.operador.toLowerCase().includes(texto))
      );
    }

    return true;
  });
  }
}