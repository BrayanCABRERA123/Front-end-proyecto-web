import { Injectable, signal } from '@angular/core';
import { ServicioHistorialOperador } from '../../models/servicio-historial.model';
import { OperatorService } from '../../services/operator';

@Injectable()
export class ServiceHistoryViewModel {

  readonly servicios = signal<ServicioHistorialOperador[]>([]);
  readonly serviciosRealizados = signal(5);
  readonly serviciosCancelados = signal(3);

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getHistorialServicios().subscribe(servicios => this.servicios.set(servicios));
  }
}
