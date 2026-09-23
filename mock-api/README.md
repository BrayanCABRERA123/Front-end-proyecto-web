# Mock API (json-server)

`npm run mock-api` (solo API, puerto 3000) · `npm run dev` (API + Angular).

- `db.json`: colecciones planas alineadas a `lavarapido-6-services-sqlserver.sql`.
- `computed.cjs`: read-models calculados (agenda de operarios, dashboard, reservas, pagos, disponibilidad).
- `server.cjs`: auth (`/login`, `/register`, `/me`), rutas `/me/*` del usuario del JWT, y el REST por defecto de json-server.

**Regla del proyecto:** los datos calculados (precios por tipo de vehículo, franjas libres, totales, KPIs)
van en endpoints del mock, no en el frontend. El frontend solo pinta y filtra.

**Convención de fechas:** la hora local de Bogotá se guarda con sufijo `Z` (`09:00Z` = 9 a.m.).

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | admin@gmail.com | Admin123! |
| Operario | camilo.operario@gmail.com | Operario123! |
| Cliente | juan.diaz@gmail.com | Cliente123! |

## Endpoints del cliente

| Método | Ruta | Uso |
|---|---|---|
| GET | `/me/dashboard` | stats, próximo servicio, vehículos, beneficios, fidelidad |
| GET/POST/DELETE | `/me/vehicles[/:id]` | no borra vehículos con reservas (409) |
| GET | `/me/booking-options?vehicleId=` | servicios con precio/duración del tipo de vehículo |
| GET | `/availability?date=&minutes=` | franjas según horario, festivos y bahías libres |
| GET/POST | `/me/bookings` | el servidor calcula la hora de fin y valida la franja |
| POST | `/me/bookings/:id/rating` | calificación 1-5 (solo servicios completados) |
| GET | `/me/payment-overview` | reservas por pagar, métodos, historial, total pagado |
| POST | `/me/payments` | el monto lo fija el servidor; queda PENDING |
| GET/PATCH/DELETE | `/me/notifications[/:id]`, POST `/me/notifications/read-all` | cualquier rol |

## Endpoints del operario

| Método | Ruta | Uso |
|---|---|---|
| GET | `/me/operator/dashboard` | jornada de hoy: contadores, promedio, servicios del día |
| GET | `/me/operator/services` | servicios asignados (uno por reserva) + contadores |
| POST | `/me/operator/services/:bookingId/start` | pendiente → en progreso; notifica al cliente |
| POST | `/me/operator/services/:bookingId/finish` | en progreso → finalizado; reserva COMPLETED, puntos de fidelidad y notificación |
| GET | `/me/operator/history` | servicios finalizados/cancelados + indicadores |
| GET | `/me/operator/ratings` | calificaciones de los últimos 12 meses + nivel de satisfacción |

## Endpoints del admin

| Método | Ruta | Uso |
|---|---|---|
| GET | `/admin/roles` | roles del personal (OPERATOR, ADMIN) |
| GET/POST | `/admin/users` | personal; al crear un operario también crea su ficha y horario base Lun-Vie 08-17 |
| PATCH | `/admin/users/:id` | `{ isActive }`: una cuenta inhabilitada recibe 403 en /login |
| DELETE | `/admin/users/:id` | solo sin historial; un operario con servicios se inhabilita |

## Estado (rama `feat/connect-mock-api`)

- [x] Fase 1: mock API · Fase 2: auth + guards · Fase 3: operarios (admin)
- [x] Fase 4: cliente (dashboard, vehículos, reservar, pagar, historial, calificar, notificaciones)
- [x] Fase 5: módulo operario (inicio, agenda, servicios asignados, calificaciones, historial)
- [x] Admin > Gestión > Usuarios: crear/inhabilitar/eliminar personal (el operario creado inicia sesión)
- [ ] Fase 6: módulo admin (dashboard, gestión: roles/servicios/promociones, pagos, reportes, horarios, reservas, config)
