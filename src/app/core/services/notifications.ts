import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// Mismo shape compartido de shared/dialogs/notification-models (client/operator/admin):
// solo cambia de dónde viene el dato.
import { AppNotification } from '../../shared/dialogs/notification-models/notification.model';

export type { AppNotification };

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: Api) {}

  // El backend ya filtra por el usuario autenticado (JWT) — sirve igual para
  // client/operator/admin, cada quien ve solo lo suyo.
  myNotifications$(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('me/notifications');
  }

  markRead$(id: number, read: boolean): Observable<void> {
    return this.api.patch<void>(`me/notifications/${id}`, { read });
  }

  markAllRead$(): Observable<void> {
    return this.api.post<void>('me/notifications/read-all', {});
  }

  remove$(id: number): Observable<void> {
    return this.api.delete<void>(`me/notifications/${id}`);
  }
}
