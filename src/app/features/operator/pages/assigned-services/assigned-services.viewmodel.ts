import { Injectable, signal } from '@angular/core';
import { ServicioAsignado } from '../../models/servicio-asignado.model';
import { OperatorService } from '../../services/operator';

export interface StatAssignedServices {
  valor: number;
  label: string;
  color: string;
}

@Injectable()
export class AssignedServicesViewModel {

  readonly stats = signal<StatAssignedServices[]>([
    { valor: 5, label: 'ASSIGNED_SERVICES.STATS.TOTAL', color: 'total' },
    { valor: 2, label: 'ASSIGNED_SERVICES.STATS.PENDING', color: 'pendiente' },
    { valor: 2, label: 'ASSIGNED_SERVICES.STATS.IN_PROGRESS', color: 'progreso' },
    { valor: 1, label: 'ASSIGNED_SERVICES.STATS.COMPLETED_TODAY', color: 'finalizado' }
  ]);

  readonly servicios = signal<ServicioAsignado[]>([]);
  readonly servicioSeleccionado = signal<ServicioAsignado | null>(null);

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getServiciosAsignados().subscribe(servicios => {
      this.servicios.set(servicios);
      this.servicioSeleccionado.set(servicios[0] ?? null);
    });
  }

  seleccionarServicio(servicio: ServicioAsignado): void {
    this.servicioSeleccionado.set(servicio);
  }
}
