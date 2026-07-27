import { Injectable, signal } from '@angular/core';
import { Notificacion } from '../../../../core/models/notificacion.model';
import { OperatorService } from '../../services/operator';

@Injectable()
export class OperatorNotificationsViewModel {

  readonly notifications = signal<Notificacion[]>([]);

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getNotificaciones().subscribe(notifs => this.notifications.set(notifs));
  }
}
