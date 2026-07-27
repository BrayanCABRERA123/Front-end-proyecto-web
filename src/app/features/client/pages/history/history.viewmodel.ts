import { Injectable, signal } from '@angular/core';
import { ServicioHistorial } from '../../models/servicio-historial.model';
import { ClientService } from '../../services/client';

@Injectable()
export class HistoryViewModel {

  readonly servicios = signal<ServicioHistorial[]>([]);

  constructor(private clientService: ClientService) {}

  cargar(): void {
    this.clientService.getHistorial().subscribe(servicios => this.servicios.set(servicios));
  }
}
