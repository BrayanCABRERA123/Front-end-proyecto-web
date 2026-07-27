import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Usuario } from '../../../core/models/usuario.model';
import { Notificacion } from '../../../core/models/notificacion.model';
import { EstadisticaOperador } from '../models/estadistica.model';
import { ReservaPendiente } from '../models/reserva-pendiente.model';
import { ServicioAsignado } from '../models/servicio-asignado.model';
import { Calificacion } from '../models/calificacion.model';
import { ServicioHistorialOperador } from '../models/servicio-historial.model';

// TODO: reemplazar los datos simulados por llamadas a Api cuando exista backend
@Injectable({
  providedIn: 'root',
})
export class OperatorService {

  getUsuario(): Observable<Usuario> {
    return of({
      nombre: 'Juan Díaz',
      email: 'juan@email.com',
      telefono: '+1234 567 890',
      direccion: 'Calle Principal #123',
      miembroDesde: 'Enero 2026'
    }).pipe(delay(200));
  }

  getNotificaciones(): Observable<Notificacion[]> {
    return of([
      { icon: 'event', title: 'NOTIFICATIONS.NEW_SERVICE', desc: 'NOTIFICATIONS.NEW_SERVICE_DESC', date: '12/03/2025 - 09:14', read: false },
      { icon: 'notifications', title: 'NOTIFICATIONS.STATUS_UPDATE', desc: 'NOTIFICATIONS.STATUS_UPDATE_DESC', date: '11/03/2025 - 14:30', read: true },
      { icon: 'warning', title: 'NOTIFICATIONS.CANCELLATION', desc: 'NOTIFICATIONS.CANCELLATION_DESC', date: '10/03/2025 - 10:00', read: false },
      { icon: 'chat', title: 'NOTIFICATIONS.CLIENT_MESSAGE', desc: 'NOTIFICATIONS.CLIENT_MESSAGE_DESC', date: '04/03/2025 - 16:45', read: true },
      { icon: 'desktop_windows', title: 'NOTIFICATIONS.SYSTEM', desc: 'NOTIFICATIONS.SYSTEM_DESC', date: '08/03/2025 - 08:00', read: true }
    ]).pipe(delay(200));
  }

  getNombreOperador(): Observable<string> {
    return of('Camilo').pipe(delay(200));
  }

  getProgresoServicios(): Observable<{ completados: number; total: number; enProgreso: number; pendientes: number }> {
    return of({ completados: 1, total: 5, enProgreso: 2, pendientes: 2 }).pipe(delay(200));
  }

  getEstadisticasHome(): Observable<EstadisticaOperador[]> {
    return of([
      { icono: 'calendar_today', valor: 5, label: 'OPERATOR_HOME.STATS.ASSIGNED', notificacion: 0 },
      { icono: 'directions_car', valor: 3, label: 'OPERATOR_HOME.STATS.VEHICLES', notificacion: 0 },
      { icono: 'notifications', valor: 5, label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notificacion: 2 },
      { icono: 'star_outline', valor: 4.3, label: 'OPERATOR_HOME.STATS.RATING', notificacion: 0 }
    ]).pipe(delay(200));
  }

  getReservasPendientes(): Observable<ReservaPendiente[]> {
    return of([
      {
        id: 1,
        titulo: 'Premium — Automovil',
        fecha: '28 Feb 2026 a las 2:00 PM',
        direccion: 'calle sur 123, los rosales',
        client: 'Juan Felipe Gonzales',
        estado: 'Confirmado',
        estadoColor: 'confirmado'
      },
      {
        id: 2,
        titulo: 'Básico — Camioneta',
        fecha: '28 Feb 2026 a las 2:00 PM',
        direccion: 'calle norte 7 06, mira flores',
        client: 'Esneider Sanchez',
        estado: 'Pendiente',
        estadoColor: 'pendiente'
      }
    ]).pipe(delay(200));
  }

  getServiciosAsignados(): Observable<ServicioAsignado[]> {
    return of([
      {
        id: 'SV-2031', tipoServicio: 'Lavado básico', ubicacion: 'Calle Falsa 123, Spring...',
        ubicacionCompleta: 'Calle Falsa 123, Springfield', fechaHora: '15/07/2026 - 10:00 AM',
        vehiculo: 'Mazda 3 - ABC123', client: 'Juan Pérez', estado: 'Pendiente',
        estadoColor: 'pendiente', metodoPago: 'Efectivo'
      },
      {
        id: 'SV-2032', tipoServicio: 'Lavado premium', ubicacion: 'Av. Siempre Viva 742, Sp...',
        ubicacionCompleta: 'Av. Siempre Viva 742, Springfield', fechaHora: '15/07/2026 - 11:30 AM',
        vehiculo: 'Toyota Corolla - DEF456', client: 'María García', estado: 'En progreso',
        estadoColor: 'progreso', metodoPago: 'Tarjeta'
      },
      {
        id: 'SV-2033', tipoServicio: 'Lavado + desinfección', ubicacion: 'Calle del Sol 10, Ciudad...',
        ubicacionCompleta: 'Calle del Sol 10, Ciudad', fechaHora: '14/07/2026 - 03:00 PM',
        vehiculo: 'Ford F-150 - GHI789', client: 'Empresa XYZ', estado: 'Finalizado',
        estadoColor: 'finalizado', metodoPago: 'PSE'
      },
      {
        id: 'SV-2034', tipoServicio: 'Lavado completo', ubicacion: 'Blvd. Norte 456, Centro...',
        ubicacionCompleta: 'Blvd. Norte 456, Centro', fechaHora: '16/07/2026 - 09:00 AM',
        vehiculo: 'Honda Civic - JKL012', client: 'Ana López', estado: 'Pendiente',
        estadoColor: 'pendiente', metodoPago: 'Nequi'
      },
      {
        id: 'SV-2035', tipoServicio: 'Lavado premium', ubicacion: 'Av. Libertad 89, Col. Ref...',
        ubicacionCompleta: 'Av. Libertad 89, Col. Reforma', fechaHora: '16/07/2026 - 02:00 PM',
        vehiculo: 'Nissan Sentra - MNO345', client: 'Carlos Ruiz', estado: 'En progreso',
        estadoColor: 'progreso', metodoPago: 'Efectivo'
      }
    ]).pipe(delay(200));
  }

  getCalificaciones(): Observable<Calificacion[]> {
    return of([
      { id: 1, client: 'Carlos H.', tipoServicio: 'Lavado Premium', fecha: '15/07/2024', estrellas: 4, comentario: '"Excelente trabajo, llegó puntual y dejó el vehículo impecable."', duracion: '1h 30m', ubicacion: 'Miraflores', idServicio: 'SV-1234' },
      { id: 2, client: 'Ana M.', tipoServicio: 'Lavado Básico', fecha: '14/07/2024', estrellas: 5, comentario: '"Muy buen servicio, el auto quedó reluciente. Lo recomiendo totalmente."', duracion: '1h 0m', ubicacion: 'San Isidro', idServicio: 'SV-1233' },
      { id: 3, client: 'Pedro L.', tipoServicio: 'Lavado Completo', fecha: '12/07/2024', estrellas: 5, comentario: '"Increíble atención al detalle, superó mis expectativas."', duracion: '2h 0m', ubicacion: 'Surco', idServicio: 'SV-1230' },
      { id: 4, client: 'María G.', tipoServicio: 'Lavado Premium', fecha: '10/07/2024', estrellas: 3, comentario: '"Buen servicio pero llegó con un poco de retraso."', duracion: '1h 15m', ubicacion: 'La Molina', idServicio: 'SV-1228' },
      { id: 5, client: 'Jorge D.', tipoServicio: 'Lavado Básico', fecha: '08/07/2024', estrellas: 5, comentario: '"Rápido y eficiente. El auto quedó como nuevo."', duracion: '45m', ubicacion: 'Barranco', idServicio: 'SV-1225' },
      { id: 6, client: 'Sofía R.', tipoServicio: 'Lavado Completo', fecha: '05/07/2024', estrellas: 4, comentario: '"Muy buen trabajo en general, volveré a solicitar el servicio."', duracion: '1h 45m', ubicacion: 'Magdalena', idServicio: 'SV-1220' }
    ]).pipe(delay(200));
  }

  getHistorialServicios(): Observable<ServicioHistorialOperador[]> {
    return of([
      { id: 'SV-1840', fechaCompletada: '20/02/2026 - 09:00', servicio: 'Premium', vehiculo: 'Automóvil', duracion: '50 min', estado: 'Finalizado', estadoColor: 'finalizado' },
      { id: 'SV-1841', fechaCompletada: '18/02/2026 - 14:30', servicio: 'Básico', vehiculo: 'Moto', duracion: '25 min', estado: 'Finalizado', estadoColor: 'finalizado' },
      { id: 'SV-1842', fechaCompletada: '15/02/2026 - 10:30', servicio: 'Completo', vehiculo: 'Camioneta', duracion: '45 min', estado: 'Finalizado', estadoColor: 'finalizado' },
      { id: 'SV-1843', fechaCompletada: '14/02/2026 - 11:15', servicio: 'Premium', vehiculo: 'Automóvil', duracion: '60 min', estado: 'Cancelado', estadoColor: 'cancelado' },
      { id: 'SV-1844', fechaCompletada: '10/02/2026 - 12:00', servicio: 'Básico', vehiculo: 'Camioneta', duracion: '75 min', estado: 'Reasignado', estadoColor: 'reasignado' },
      { id: 'SV-1845', fechaCompletada: '08/02/2026 - 08:45', servicio: 'Completo', vehiculo: 'Automóvil', duracion: '55 min', estado: 'Finalizado', estadoColor: 'finalizado' },
      { id: 'SV-1846', fechaCompletada: '05/02/2026 - 16:00', servicio: 'Premium', vehiculo: 'Moto', duracion: '30 min', estado: 'Cancelado', estadoColor: 'cancelado' },
      { id: 'SV-1847', fechaCompletada: '02/02/2026 - 10:00', servicio: 'Básico', vehiculo: 'Automóvil', duracion: '40 min', estado: 'Finalizado', estadoColor: 'finalizado' }
    ]).pipe(delay(200));
  }
}
