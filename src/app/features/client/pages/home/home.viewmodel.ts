import { Injectable, signal } from '@angular/core';
import { Usuario } from '../../../../core/models/usuario.model';
import { ReservaProxima } from '../../models/reserva.model';
import { ClientService } from '../../services/client';

@Injectable()
export class HomeViewModel {

  readonly usuario = signal<Usuario | null>(null);
  readonly proximasReservas = signal<ReservaProxima[]>([]);

  constructor(private clientService: ClientService) {}

  cargar(): void {
    this.clientService.getUsuario().subscribe(usuario => this.usuario.set(usuario));
    this.clientService.getProximasReservas().subscribe(reservas => this.proximasReservas.set(reservas));
  }
}
