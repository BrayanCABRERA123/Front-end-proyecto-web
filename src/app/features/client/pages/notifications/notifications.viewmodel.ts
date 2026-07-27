import { Injectable, signal } from '@angular/core';
import { Notificacion } from '../../../../core/models/notificacion.model';
import { ClientService } from '../../services/client';

@Injectable()
export class ClientNotificationsViewModel {

  readonly notifications = signal<Notificacion[]>([]);

  constructor(private clientService: ClientService) {}

  cargar(): void {
    this.clientService.getNotificaciones().subscribe(notifs => this.notifications.set(notifs));
  }
}
