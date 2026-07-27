import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HistoryViewModel } from './history.viewmodel';

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
  providers: [HistoryViewModel],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    public vm: HistoryViewModel
  ) {}

  ngOnInit(): void {
    this.vm.cargar();
  }

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

  // TRADUCIR EXTRAS
  getExtrasTraducidos(extras: string[]): string[] {
    return extras.map(e => this.translate.instant('EXTRA.' + e));
  }

  // FILTRO COMPLETO — combina los datos del viewmodel con el estado de filtros de la vista
  get serviciosFiltrados() {
    return this.vm.servicios().filter(servicio => {

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