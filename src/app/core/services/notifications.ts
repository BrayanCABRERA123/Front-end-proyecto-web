import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { NotificationResponse, PageResponse } from '../models/notification.models';

// la bandeja muestra las más recientes (el backend permite hasta 100 por página)
const INBOX_SIZE = 100;

// bandeja del usuario con sesión abierta contra el notification-service.
// el id del usuario nunca viaja: el backend lo saca del token JWT.
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {

  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/notifications`;

  // notificaciones del usuario, de la más reciente a la más antigua
  list(): Observable<NotificationResponse[]> {
    const params = new HttpParams().set('page', 0).set('size', INBOX_SIZE);
    return this.http.get<PageResponse<NotificationResponse>>(this.url, { params })
      .pipe(map(page => page.items));
  }

  // número de la campanita
  unreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.url}/unread-count`).pipe(map(response => response.count));
  }

  markRead(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.url}/${id}/read`, null);
  }

  markUnread(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.url}/${id}/unread`, null);
  }

  markAllRead(): Observable<number> {
    return this.http.post<{ updated: number }>(`${this.url}/read-all`, null).pipe(map(response => response.updated));
  }

  // borrado lógico en el backend: responde 204 sin cuerpo
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
