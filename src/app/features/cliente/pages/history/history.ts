import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// importamos el card de cada servicio
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HistoryCardComponent,
    MatIconModule
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent {

  // filtro activo — 'todos', 'pagados', 'pendientes'
  filtroActivo: string = 'todos';

  // fechas del filtro
  fechaDesde: string = '';
  fechaHasta: string = '';

  // texto del buscador
  busqueda: string = '';

  // lista de servicios del historial
  servicios = [
    {
      id: 1,
      titulo: 'Premium — Automóvil',
      fecha: '28/03/2026',
      direccion: 'Calle Falsa 123, Springfield',
      tipoServicio: 'Lavado completo',
      serviciosExtra: 'Cera / Aspirado',
      asignacion: 'Manual (Juan)',
      estado: 'Finalizado',
      precio: 35,
      pagado: true
    },
    {
      id: 2,
      titulo: 'Básico — Moto',
      fecha: '16/12/2025',
      direccion: 'Calle 42 #13-33',
      tipoServicio: 'Lavado completo',
      serviciosExtra: 'Cera',
      asignacion: 'Automática',
      estado: 'Pendiente',
      precio: 35,
      pagado: false
    }
  ];

  // filtra los servicios según el filtro activo y la búsqueda
  get serviciosFiltrados() {
    return this.servicios.filter(servicio => {

      // filtro por estado
      if (this.filtroActivo === 'pagados' && !servicio.pagado) return false;
      if (this.filtroActivo === 'pendientes' && servicio.pagado) return false;

      // filtro por búsqueda de texto
      if (this.busqueda) {
        const texto = this.busqueda.toLowerCase();
        return servicio.direccion.toLowerCase().includes(texto) ||
               servicio.tipoServicio.toLowerCase().includes(texto) ||
               servicio.asignacion.toLowerCase().includes(texto);
      }

      return true;
    });
  }
}