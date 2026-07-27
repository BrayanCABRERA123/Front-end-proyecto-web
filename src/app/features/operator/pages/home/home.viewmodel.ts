import { Injectable, computed, signal } from '@angular/core';
import { EstadisticaOperador } from '../../models/estadistica.model';
import { ReservaPendiente } from '../../models/reserva-pendiente.model';
import { OperatorService } from '../../services/operator';

@Injectable()
export class OperatorHomeViewModel {

  readonly nombreOperator = signal<string>('');
  readonly stats = signal<EstadisticaOperador[]>([]);
  readonly reservasPendientes = signal<ReservaPendiente[]>([]);
  readonly progreso = signal({ completados: 0, total: 0, enProgreso: 0, pendientes: 0 });

  readonly porcentajeProgreso = computed(() => {
    const { completados, total } = this.progreso();
    return total === 0 ? 0 : (completados / total) * 100;
  });

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getNombreOperador().subscribe(nombre => this.nombreOperator.set(nombre));
    this.operatorService.getEstadisticasHome().subscribe(stats => this.stats.set(stats));
    this.operatorService.getReservasPendientes().subscribe(reservas => this.reservasPendientes.set(reservas));
    this.operatorService.getProgresoServicios().subscribe(progreso => this.progreso.set(progreso));
  }
}
