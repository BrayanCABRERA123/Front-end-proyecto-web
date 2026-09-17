import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { HistoryCardComponent } from './components/history-card/history-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Api } from '../../../../core/services/api';
import { Auth } from '../../../../core/services/auth';
import { Reserva } from '../../../../shared/dialogs/reservation-models/reservation.model';

// mapea el estado de una reserva al vocabulario de STATUS.* que usa la tarjeta de historial
const ESTADO_A_STATUS: Record<string, string> = {
  pendiente: 'PENDING',
  en_progreso: 'ON_THE_WAY',
  finalizado: 'COMPLETED'
};

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
export class HistoryComponent implements OnInit {

  // id del cliente logueado; 2 (Juan Díaz) es el demo por defecto si nadie inició sesión
  private get userId(): number {
    return this.auth.getCurrentUser()?.id ?? 2;
  }

  constructor(private translate: TranslateService, private api: Api, private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      historial: this.api.getClientHistory(this.userId),
      reservas: this.api.getReservationsByCustomer(this.userId)
    }).subscribe(({ historial, reservas }) => {
      const reservasComoHistorial = reservas.map(r => this.reservaAHistorial(r));
      this.servicios = [...reservasComoHistorial, ...historial];
      this.cdr.detectChanges();
    });
  }

  // convierte una reserva (agendada desde "Reservar lavado") al formato que espera la tarjeta de historial
  private reservaAHistorial(r: Reserva) {
    const clave = `SERVICE.${r.servicio}_PRICE`;
    const texto: string = this.translate.instant(clave);
    const precio = parseInt(texto.replace(/[^0-9]/g, ''), 10) || 0;

    return {
      id: `reserva-${r.id}`,
      titulo: r.servicio,
      fecha: r.fecha,
      direccion: r.direccion,
      tipoServicio: r.servicio,
      serviciosExtra: [] as string[],
      asignacionTipo: 'AUTO',
      operador: '',
      estado: ESTADO_A_STATUS[r.estado] ?? 'PENDING',
      precio,
      pagado: false
    };
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

  // SERVICIOS (viene de la API mock)
  servicios: any[] = [];

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