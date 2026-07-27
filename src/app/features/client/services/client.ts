import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Usuario } from '../../../core/models/usuario.model';
import { Notificacion } from '../../../core/models/notificacion.model';
import { ReservaProxima } from '../models/reserva.model';
import { ServicioHistorial } from '../models/servicio-historial.model';

// TODO: reemplazar los datos simulados por llamadas a Api cuando exista backend
@Injectable({
  providedIn: 'root',
})
export class ClientService {

  getUsuario(): Observable<Usuario> {
    return of({
      nombre: 'Juan Díaz',
      email: 'juan@email.com',
      telefono: '+1234 567 890',
      direccion: 'Calle Principal #123',
      miembroDesde: 'Enero 2026'
    }).pipe(delay(200));
  }

  getProximasReservas(): Observable<ReservaProxima[]> {
    return of<ReservaProxima[]>([
      { tipo: 'PREMIUM', vehiculo: 'CAR', fecha: '25/02/2026 10:00', estado: 'CONFIRMED' },
      { tipo: 'BASIC', vehiculo: 'TRUCK', fecha: '28/02/2026 14:00', estado: 'CONFIRMED' }
    ]).pipe(delay(200));
  }

  getNotificaciones(): Observable<Notificacion[]> {
    return of([
      { icon: 'event', title: 'NOTIFICATIONS.RESERVATION_CONFIRMED', desc: 'NOTIFICATIONS.RESERVATION_DESC', date: 'NOTIFICATIONS.TIME_2H', read: false },
      { icon: 'notifications', title: 'NOTIFICATIONS.REMINDER', desc: 'NOTIFICATIONS.REMINDER_DESC', date: 'NOTIFICATIONS.TIME_1D', read: false },
      { icon: 'card_giftcard', title: 'NOTIFICATIONS.PROMO', desc: 'NOTIFICATIONS.PROMO_DESC', date: 'NOTIFICATIONS.TIME_2D', read: true },
      { icon: 'info', title: 'NOTIFICATIONS.UPDATE', desc: 'NOTIFICATIONS.UPDATE_DESC', date: 'NOTIFICATIONS.TIME_3D', read: true }
    ]).pipe(delay(200));
  }

  getHistorial(): Observable<ServicioHistorial[]> {
    return of<ServicioHistorial[]>([
      {
        id: 1,
        titulo: 'PREMIUM_CAR',
        fecha: '28/03/2026',
        direccion: 'Calle Falsa 123, Springfield',
        tipoServicio: 'FULL_WASH',
        serviciosExtra: ['WAX', 'VACUUM'],
        asignacionTipo: 'MANUAL',
        operador: 'Juan',
        estado: 'COMPLETED',
        precio: 35,
        pagado: true
      },
      {
        id: 2,
        titulo: 'BASIC_MOTO',
        fecha: '16/12/2025',
        direccion: 'Calle 42 #13-33',
        tipoServicio: 'FULL_WASH',
        serviciosExtra: ['WAX'],
        asignacionTipo: 'AUTO',
        operador: '',
        estado: 'PENDING',
        precio: 35,
        pagado: false
      }
    ]).pipe(delay(200));
  }
}
