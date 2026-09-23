const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const {
  computeOperators,
  computeOperatorById,
  getCustomerByUserId,
  computeVehicle,
  computeVehiclesForCustomer,
  computeBooking,
  computeBookingsForCustomer,
  computePayment,
  computePaymentsForCustomer,
  computeNotificationsForUser,
  computeDashboard,
  computeBookingOptions,
  computeAvailability,
  computePaymentOverview,
  latestPaymentForBooking,
  computeAdminBooking,
  computeAdminBookings,
  computeOperatorOptions,
  assignedOperatorRow,
  getBookingContext,
  getOperatorByUserId,
  computeOperatorServices,
  computeOperatorAssigned,
  computeOperatorDashboard,
  computeOperatorHistory,
  computeOperatorRatings,
  computeAdminPayment,
  computeAdminPayments,
  computeAdminPayableBookings,
  computePaymentMethods,
  computeAdminDashboard,
  DAY_KEYS,
  computeAdminSchedule,
  computeAdminReports
} = require('./computed.cjs');

// MOCK ONLY: fixed dev secret, plaintext passwords in db.json. Never do this against a real backend.
const JWT_SECRET = 'mock-dev-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = '8h';

const server = jsonServer.create();
const router = jsonServer.router('mock-api/db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Convención del db.json: la hora local se guarda con sufijo Z (09:00Z = 9 a.m. en Bogotá).
// Todo timestamp nuevo que se muestre en pantalla usa esto para no correrse 5 horas.
function nowLocalIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
}

function omitPassword(user) {
  const { contrasena, ...userSafe } = user;
  return userSafe;
}

function initialsFor(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .map(parte => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function nextIdOf(collectionName) {
  return router.db.get(collectionName).value().reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, correo: user.correo, rol: user.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

server.post('/login', (req, res) => {
  const { contrasena } = req.body;
  // sin distinguir mayúsculas: el admin guarda los correos del personal en minúscula
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const user = router.db.get('users').find(u => String(u.correo).toLowerCase() === correo).value();

  if (!user || user.contrasena !== contrasena) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Esta cuenta está deshabilitada' });
  }

  res.status(200).json({ accessToken: signToken(user), user: omitPassword(user) });
});

// Single round trip: validates terms + data-policy acceptance and duplicate email,
// then creates the user. Real backend would hash the password and validate server-side.
server.post('/register', (req, res) => {
  const { nombre, contrasena, telefono, aceptaTerminos, aceptaPoliticaDatos } = req.body;
  const correo = String(req.body.correo || '').trim().toLowerCase();

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  if (aceptaTerminos !== true || aceptaPoliticaDatos !== true) {
    return res.status(400).json({ message: 'Debes aceptar los Términos y Condiciones y la Política de Datos' });
  }

  const users = router.db.get('users');

  if (users.find(u => String(u.correo).toLowerCase() === correo).value()) {
    return res.status(409).json({ message: 'Este correo ya está registrado' });
  }

  const iniciales = initialsFor(nombre);

  const nextId = users.value().reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;

  const nuevoUsuario = {
    id: nextId,
    nombre,
    correo,
    telefono: telefono || null,
    contrasena,
    iniciales,
    rol: 'CLIENT',
    aceptaTerminos: true,
    aceptaPoliticaDatos: true,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  users.push(nuevoUsuario).write();

  // Every client also gets a customer row (loyalty ledger, vehicles, bookings hang off this id).
  const customers = router.db.get('customers');
  const nextCustomerId = customers.value().reduce((max, c) => Math.max(max, c.id || 0), 0) + 1;

  customers
    .push({
      id: nextCustomerId,
      userId: nuevoUsuario.id,
      loyaltyPoints: 0,
      customerSince: nuevoUsuario.createdAt.slice(0, 10)
    })
    .write();

  res.status(201).json({ accessToken: signToken(nuevoUsuario), user: omitPassword(nuevoUsuario) });
});

// Resolves the caller's identity from the JWT. Returns the user row (with password) or null —
// callers omit the password themselves when sending it back in a response body.
function getAuthUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return router.db.get('users').find({ id: payload.sub }).value() || null;
  } catch {
    return null;
  }
}

// Guards every /me/* route: resolves req.user from the JWT or short-circuits with 401.
function requireAuth(req, res, next) {
  const user = getAuthUser(req);

  if (!user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  req.user = user;
  next();
}

// Bootstraps the session on app reload.
server.get('/me', requireAuth, (req, res) => {
  res.status(200).json(omitPassword(req.user));
});

// ---------------------------------------------------------------------------
// Client self-service: dashboard, vehicles, bookings, payments, notifications —
// all scoped to the authenticated user via the JWT, never a client-supplied id.
// ---------------------------------------------------------------------------

function requireCustomer(req, res, next) {
  const customer = getCustomerByUserId(router.db, req.user.id);

  if (!customer) {
    return res.status(403).json({ message: 'Esta cuenta no tiene un perfil de cliente' });
  }

  req.customer = customer;
  next();
}

// Deja una notificación en la bandeja del usuario (tabla notification del SQL).
function pushNotification(userId, { code, type, icon, title, desc, referenceEntity = null, referenceId = null }) {
  const notifications = router.db.get('notifications');
  const notificationType = router.db.get('notificationTypes').find({ code }).value();
  const nextId = notifications.value().reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;

  notifications
    .push({
      id: nextId,
      userId,
      notificationTypeId: notificationType ? notificationType.id : null,
      type,
      icon,
      title,
      desc,
      referenceEntity,
      referenceId,
      isRead: false,
      sentAt: nowLocalIso()
    })
    .write();
}

server.get('/me/dashboard', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json(computeDashboard(router.db, req.user));
});

server.get('/me/vehicles', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json(computeVehiclesForCustomer(router.db, req.customer.id));
});

server.post('/me/vehicles', requireAuth, requireCustomer, (req, res) => {
  const { vehicleTypeId, brand, model, color } = req.body;
  // Placa normalizada (ABC-123, abc 123 → ABC123) para que el control de duplicados sea confiable.
  const licensePlate = String(req.body.licensePlate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!licensePlate || !vehicleTypeId) {
    return res.status(400).json({ message: 'Placa y tipo de vehículo son obligatorios' });
  }

  const vehicles = router.db.get('vehicles');
  const activeDuplicate = vehicles.find({ licensePlate }).value();

  if (activeDuplicate) {
    return res.status(409).json({ message: 'Ya existe un vehículo registrado con esa placa' });
  }

  const nextId = vehicles.value().reduce((max, v) => Math.max(max, v.id || 0), 0) + 1;
  const newVehicle = {
    id: nextId,
    customerId: req.customer.id,
    licensePlate,
    vehicleTypeId: Number(vehicleTypeId),
    brand: brand || null,
    model: model || null,
    color: color || null,
    createdAt: new Date().toISOString()
  };

  vehicles.push(newVehicle).write();
  res.status(201).json(computeVehicle(router.db, newVehicle));
});

server.delete('/me/vehicles/:id', requireAuth, requireCustomer, (req, res) => {
  const vehicles = router.db.get('vehicles');
  const vehicle = vehicles.find({ id: Number(req.params.id) }).value();

  if (!vehicle || vehicle.customerId !== req.customer.id) {
    return res.status(404).json({ message: 'Vehículo no encontrado' });
  }

  // booking.vehicle_id es FK en el SQL: un vehículo con reservas no se puede borrar.
  if (router.db.get('bookings').find({ vehicleId: vehicle.id }).value()) {
    return res.status(409).json({ message: 'No puedes eliminar un vehículo con reservas registradas' });
  }

  vehicles.remove({ id: vehicle.id }).write();
  res.status(204).end();
});

server.get('/me/bookings', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json(computeBookingsForCustomer(router.db, req.customer.id));
});

// Catálogo de servicios con el precio y la duración que aplican al tipo de ese vehículo
// (service_price por vehicle_type en el SQL) — el frontend ya no calcula precios.
server.get('/me/booking-options', requireAuth, requireCustomer, (req, res) => {
  const vehicle = router.db.get('vehicles').find({ id: Number(req.query.vehicleId) }).value();

  if (!vehicle || vehicle.customerId !== req.customer.id) {
    return res.status(404).json({ message: 'Vehículo no encontrado' });
  }

  res.status(200).json(computeBookingOptions(router.db, vehicle));
});

// Franjas horarias de un día según horario de atención, excepciones y bahías ocupadas.
server.get('/availability', (req, res) => {
  const { date } = req.query;
  const minutes = Number(req.query.minutes) || 60;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    return res.status(400).json({ message: 'Fecha inválida (formato yyyy-mm-dd)' });
  }

  res.status(200).json(computeAvailability(router.db, date, minutes));
});

// El cliente solo manda qué quiere (vehículo, servicios, fecha, hora, dirección); el servidor
// valida que los precios correspondan al tipo de vehículo, calcula la hora de fin con la
// duración estimada y rechaza la franja si ya no hay bahías libres.
server.post('/me/bookings', requireAuth, requireCustomer, (req, res) => {
  const { vehicleId, servicePriceIds, date, time, serviceAddress, notes } = req.body;

  if (!vehicleId || !Array.isArray(servicePriceIds) || servicePriceIds.length === 0 || !date || !time || !serviceAddress) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para la reserva' });
  }

  const vehicle = router.db.get('vehicles').find({ id: Number(vehicleId) }).value();
  if (!vehicle || vehicle.customerId !== req.customer.id) {
    return res.status(404).json({ message: 'Vehículo no encontrado' });
  }

  const prices = servicePriceIds.map(id => router.db.get('servicePrices').find({ id: Number(id) }).value());
  if (prices.some(sp => !sp || sp.vehicleTypeId !== vehicle.vehicleTypeId)) {
    return res.status(400).json({ message: 'El servicio no aplica para este tipo de vehículo' });
  }

  const totalMinutes = prices.reduce((sum, sp) => sum + sp.estimatedMinutes, 0);
  const availability = computeAvailability(router.db, date, totalMinutes);
  const slot = availability.slots.find(s => s.time === time);

  if (!availability.open || !slot || !slot.available) {
    return res.status(409).json({ message: 'La franja seleccionada ya no está disponible' });
  }

  // Convención del mock: la hora local se guarda con sufijo Z (igual que los datos semilla).
  const start = new Date(`${date}T${time}:00.000Z`);
  const end = new Date(start.getTime() + totalMinutes * 60000);

  const pendingStatus = router.db.get('bookingStatuses').find({ code: 'PENDING' }).value();
  const bookings = router.db.get('bookings');
  const nextBookingId = bookings.value().reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;
  const lastCode = bookings.value().reduce((max, b) => Math.max(max, Number(String(b.code).replace('SV-', '')) || 0), 0);
  const code = `SV-${String(lastCode + 1).padStart(4, '0')}`;

  const newBooking = {
    id: nextBookingId,
    code,
    vehicleId: vehicle.id,
    serviceBayId: null,
    serviceAddress,
    scheduledStart: start.toISOString(),
    scheduledEnd: end.toISOString(),
    bookingStatusId: pendingStatus ? pendingStatus.id : 1,
    bookedBy: req.user.id,
    cancellationReasonId: null,
    pointsRedeemed: 0,
    pointsDiscountAmount: 0,
    notes: notes || null
  };
  bookings.push(newBooking).write();

  const bookingServices = router.db.get('bookingServices');
  let nextBsId = bookingServices.value().reduce((max, bs) => Math.max(max, bs.id || 0), 0) + 1;

  for (const sp of prices) {
    bookingServices.push({ id: nextBsId, bookingId: newBooking.id, servicePriceId: sp.id, quantity: 1 }).write();
    nextBsId += 1;
  }

  pushNotification(req.user.id, {
    code: 'CONFIRMACION',
    type: 'confirmacion',
    icon: 'event_available',
    title: 'Reserva recibida',
    desc: `Tu reserva ${code} para el ${date} a las ${time} quedó registrada y está pendiente de confirmación.`,
    referenceEntity: 'booking',
    referenceId: newBooking.id
  });

  res.status(201).json(computeBooking(router.db, newBooking));
});

// Calificación del servicio (service_execution.quality_rating 1-5 + comentario).
server.post('/me/bookings/:id/rating', requireAuth, requireCustomer, (req, res) => {
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
  }

  const booking = router.db.get('bookings').find({ id: Number(req.params.id) }).value();
  const vehicle = booking ? router.db.get('vehicles').find({ id: booking.vehicleId }).value() : null;
  if (!booking || !vehicle || vehicle.customerId !== req.customer.id) {
    return res.status(404).json({ message: 'Reserva no encontrada' });
  }

  const computed = computeBooking(router.db, booking);
  if (!computed.canRate) {
    return res.status(409).json({ message: 'Este servicio no se puede calificar' });
  }

  const bookingServiceIds = router.db.get('bookingServices').filter({ bookingId: booking.id }).value().map(bs => bs.id);
  const ratedAt = nowLocalIso();

  router.db
    .get('serviceExecutions')
    .filter(e => bookingServiceIds.includes(e.bookingServiceId))
    .each(e => {
      e.qualityRating = rating;
      e.qualityComment = comment || null;
      e.ratedAt = ratedAt;
      e.isCommentVisible = true;
    })
    .write();

  res.status(200).json(computeBooking(router.db, booking));
});

// Todo lo que necesita la pantalla "Pagar servicio" en una sola llamada.
server.get('/me/payment-overview', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json(computePaymentOverview(router.db, req.customer.id));
});

server.get('/me/payments', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json(computePaymentsForCustomer(router.db, req.customer.id));
});

// Every method requires manual verification against the bank statement (Nequi/Bancolombia/
// Daviplata/Efectivo) — mirrors the "pagos pendientes de revisión" workflow the admin reviews.
server.post('/me/payments', requireAuth, requireCustomer, (req, res) => {
  const { bookingId, paymentAccountId } = req.body;
  const transactionReference = typeof req.body.transactionReference === 'string' ? req.body.transactionReference.trim() : '';

  if (!bookingId || !paymentAccountId) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para el pago' });
  }

  const booking = router.db.get('bookings').find({ id: Number(bookingId) }).value();
  const vehicle = booking ? router.db.get('vehicles').find({ id: booking.vehicleId }).value() : null;
  if (!booking || !vehicle || vehicle.customerId !== req.customer.id) {
    return res.status(404).json({ message: 'Reserva no encontrada' });
  }

  const account = router.db.get('paymentAccounts').find({ id: Number(paymentAccountId), isActive: true }).value();
  const methodType = account ? router.db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value() : null;
  if (!account || !methodType) {
    return res.status(400).json({ message: 'Método de pago no válido' });
  }

  if (methodType.requiresReceipt && !transactionReference) {
    return res.status(400).json({ message: 'Debes indicar la referencia de la transacción' });
  }

  const previous = latestPaymentForBooking(router.db, booking.id);
  const previousStatus = previous ? router.db.get('paymentStatuses').find({ id: previous.paymentStatusId }).value() : null;
  if (previousStatus && previousStatus.code !== 'REJECTED') {
    return res.status(409).json({ message: 'Esta reserva ya tiene un pago registrado' });
  }

  // El monto lo fija el servidor con el precio calculado de la reserva, nunca el cliente.
  const amount = computeBooking(router.db, booking).price;

  const pendingStatus = router.db.get('paymentStatuses').find({ code: 'PENDING' }).value();
  const payments = router.db.get('payments');
  const nextId = payments.value().reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;

  const newPayment = {
    id: nextId,
    bookingId: booking.id,
    paymentAccountId: Number(paymentAccountId),
    paymentStatusId: pendingStatus ? pendingStatus.id : 1,
    amount: Number(amount),
    processedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: nowLocalIso()
  };
  payments.push(newPayment).write();

  if (transactionReference) {
    const receipts = router.db.get('paymentReceipts');
    const nextReceiptId = receipts.value().reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
    receipts
      .push({
        id: nextReceiptId,
        paymentId: newPayment.id,
        fileUrl: null,
        transactionReference,
        reportedAmount: Number(amount),
        uploadedAt: nowLocalIso(),
        uploadedBy: req.user.id,
        reviewedAt: null,
        reviewedBy: null,
        reviewComment: null
      })
      .write();
  }

  res.status(201).json(computePayment(router.db, newPayment));
});

server.get('/me/notifications', requireAuth, (req, res) => {
  res.status(200).json(computeNotificationsForUser(router.db, req.user.id));
});

// Solo el dueño de la notificación puede marcarla o borrarla (el id del usuario sale del JWT).
function findOwnNotification(req, res) {
  const notification = router.db.get('notifications').find({ id: Number(req.params.id) }).value();

  if (!notification || notification.userId !== req.user.id) {
    res.status(404).json({ message: 'Notificación no encontrada' });
    return null;
  }

  return notification;
}

server.patch('/me/notifications/:id', requireAuth, (req, res) => {
  const notification = findOwnNotification(req, res);
  if (!notification) return;

  router.db.get('notifications').find({ id: notification.id }).assign({ isRead: req.body.read === true }).write();
  res.status(204).end();
});

server.post('/me/notifications/read-all', requireAuth, (req, res) => {
  router.db
    .get('notifications')
    .filter({ userId: req.user.id })
    .each(n => {
      n.isRead = true;
    })
    .write();
  res.status(204).end();
});

server.delete('/me/notifications/:id', requireAuth, (req, res) => {
  const notification = findOwnNotification(req, res);
  if (!notification) return;

  router.db.get('notifications').remove({ id: notification.id }).write();
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Operario: su jornada, servicios asignados, historial y calificaciones — siempre los del
// operario autenticado (JWT). Iniciar/finalizar actualiza service_execution y la reserva.
// ---------------------------------------------------------------------------

function requireOperator(req, res, next) {
  const operator = getOperatorByUserId(router.db, req.user.id);

  if (!operator) {
    return res.status(403).json({ message: 'Esta cuenta no tiene un perfil de operario' });
  }

  req.operator = operator;
  next();
}

server.get('/me/operator/dashboard', requireAuth, requireOperator, (req, res) => {
  res.status(200).json(computeOperatorDashboard(router.db, req.user, req.operator));
});

server.get('/me/operator/services', requireAuth, requireOperator, (req, res) => {
  res.status(200).json(computeOperatorAssigned(router.db, req.operator.id));
});

server.get('/me/operator/history', requireAuth, requireOperator, (req, res) => {
  res.status(200).json(computeOperatorHistory(router.db, req.operator.id));
});

server.get('/me/operator/ratings', requireAuth, requireOperator, (req, res) => {
  res.status(200).json(computeOperatorRatings(router.db, req.operator.id));
});

// Ejecuciones de esta reserva que le tocan al operario autenticado (404 si no es suya).
function operatorExecutionsForBooking(req, res) {
  const bookingId = Number(req.params.bookingId);
  const booking = router.db.get('bookings').find({ id: bookingId }).value();
  const bookingServiceIds = router.db.get('bookingServices').filter({ bookingId }).value().map(bs => bs.id);
  const executions = router.db
    .get('serviceExecutions')
    .filter(e => e.operatorId === req.operator.id && bookingServiceIds.includes(e.bookingServiceId))
    .value();

  if (!booking || executions.length === 0) {
    res.status(404).json({ message: 'Servicio no encontrado en tu agenda' });
    return null;
  }

  return { booking, executions };
}

function statusIdOf(collection, code) {
  const row = router.db.get(collection).find({ code }).value();
  return row ? row.id : null;
}

function currentOperatorService(req, bookingId) {
  return computeOperatorServices(router.db, req.operator.id).find(s => s.id === bookingId);
}

server.post('/me/operator/services/:bookingId/start', requireAuth, requireOperator, (req, res) => {
  const found = operatorExecutionsForBooking(req, res);
  if (!found) return;

  const current = currentOperatorService(req, found.booking.id);
  if (current.status !== 'pendiente') {
    return res.status(409).json({ message: 'Este servicio ya fue iniciado o está cerrado' });
  }

  const startedAt = nowLocalIso();
  const inProgressExec = statusIdOf('executionStatuses', 'IN_PROGRESS');
  const ids = found.executions.map(e => e.id);

  router.db
    .get('serviceExecutions')
    .filter(e => ids.includes(e.id))
    .each(e => {
      e.executionStatusId = inProgressExec;
      e.startedAt = startedAt;
    })
    .write();
  router.db.get('bookings').find({ id: found.booking.id }).assign({ bookingStatusId: statusIdOf('bookingStatuses', 'IN_PROGRESS') }).write();

  const ctx = getBookingContext(router.db, found.booking.id);
  if (ctx && ctx.customerUser) {
    pushNotification(ctx.customerUser.id, {
      code: 'RECORDATORIO',
      type: 'recordatorio',
      icon: 'local_car_wash',
      title: 'Tu servicio comenzó',
      desc: `${req.user.nombre} inició el servicio ${found.booking.code}.`,
      referenceEntity: 'booking',
      referenceId: found.booking.id
    });
  }

  res.status(200).json(currentOperatorService(req, found.booking.id));
});

// Al finalizar: la reserva pasa a COMPLETED cuando todas sus ejecuciones terminaron, y el
// cliente gana puntos de fidelidad (1 punto por cada $1.000, como en los datos semilla).
server.post('/me/operator/services/:bookingId/finish', requireAuth, requireOperator, (req, res) => {
  const found = operatorExecutionsForBooking(req, res);
  if (!found) return;

  const current = currentOperatorService(req, found.booking.id);
  if (current.status !== 'en_progreso') {
    return res.status(409).json({ message: 'Solo puedes finalizar un servicio en progreso' });
  }

  const finishedAt = nowLocalIso();
  const completedExec = statusIdOf('executionStatuses', 'COMPLETED');
  const ids = found.executions.map(e => e.id);

  router.db
    .get('serviceExecutions')
    .filter(e => ids.includes(e.id))
    .each(e => {
      e.executionStatusId = completedExec;
      e.startedAt = e.startedAt || finishedAt;
      e.finishedAt = finishedAt;
    })
    .write();

  const bookingServiceIds = router.db.get('bookingServices').filter({ bookingId: found.booking.id }).value().map(bs => bs.id);
  const allExecutions = router.db.get('serviceExecutions').filter(e => bookingServiceIds.includes(e.bookingServiceId)).value();
  const allDone = allExecutions.every(e => e.executionStatusId === completedExec || e.executionStatusId === statusIdOf('executionStatuses', 'CANCELLED'));

  if (allDone) {
    router.db.get('bookings').find({ id: found.booking.id }).assign({ bookingStatusId: statusIdOf('bookingStatuses', 'COMPLETED') }).write();

    const ctx = getBookingContext(router.db, found.booking.id);
    if (ctx && ctx.customer) {
      const points = Math.floor(computeBooking(router.db, found.booking).price / 1000);
      const balanceAfter = (ctx.customer.loyaltyPoints || 0) + points;

      router.db
        .get('loyaltyTransactions')
        .push({
          id: nextIdOf('loyaltyTransactions'),
          customerId: ctx.customer.id,
          loyaltyMovementTypeId: statusIdOf('loyaltyMovementTypes', 'EARNED'),
          bookingId: found.booking.id,
          points,
          balanceAfter,
          expiresOn: null,
          description: 'Lavado completado',
          createdAt: finishedAt
        })
        .write();
      // customer.loyalty_points es copia del balance de la última transacción (regla del SQL)
      router.db.get('customers').find({ id: ctx.customer.id }).assign({ loyaltyPoints: balanceAfter }).write();
    }

    if (ctx && ctx.customerUser) {
      pushNotification(ctx.customerUser.id, {
        code: 'CONFIRMACION',
        type: 'confirmacion',
        icon: 'check_circle',
        title: 'Servicio finalizado',
        desc: `Tu servicio ${found.booking.code} terminó. ¡Califica la atención desde tu historial!`,
        referenceEntity: 'booking',
        referenceId: found.booking.id
      });
    }
  }

  res.status(200).json(currentOperatorService(req, found.booking.id));
});

// ---------------------------------------------------------------------------
// Admin: gestión de cuentas del personal (administradores y operarios).
// Los clientes se registran solos por /register; aquí solo se da de alta al personal.
// ---------------------------------------------------------------------------

function requireAdmin(req, res, next) {
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Solo un administrador puede hacer esto' });
  }
  next();
}

const STAFF_ROLES = [
  { code: 'OPERATOR', name: 'Operario' },
  { code: 'ADMIN', name: 'Administrador' }
];

// Mismas reglas que el formulario de registro del frontend.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
const PHONE_PATTERN = /^3[0-9]{9}$/;

// Horario base de un operario nuevo (Lun-Vie 08:00-17:00), igual al de los operarios semilla;
// el admin lo ajusta después desde Horarios.
const DEFAULT_OPERATOR_WEEK = [1, 2, 3, 4, 5].map(dayOfWeek => ({ dayOfWeek, startsAt: '08:00', endsAt: '17:00' }));

function computeStaffUser(user) {
  const role = STAFF_ROLES.find(r => r.code === user.rol);
  const operator = user.rol === 'OPERATOR' ? router.db.get('operators').find({ userId: user.id }).value() : null;

  return {
    id: user.id,
    name: user.nombre,
    email: user.correo,
    phone: user.telefono,
    role: user.rol,
    roleName: role ? role.name : user.rol,
    operatorId: operator ? `OP-${operator.id}` : null,
    specialty: operator ? operator.specialty : null,
    dateAdded: (user.createdAt || '').slice(0, 10),
    status: user.isActive === false ? 'disabled' : 'active'
  };
}

server.get('/admin/roles', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(STAFF_ROLES);
});

server.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
  const staff = router.db
    .get('users')
    .value()
    .filter(u => STAFF_ROLES.some(r => r.code === u.rol))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map(computeStaffUser);

  res.status(200).json(staff);
});

// Crea la cuenta con contraseña inicial: el operario entra de una vez por /login con ese correo.
server.post('/admin/users', requireAuth, requireAdmin, (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const telefono = String(req.body.telefono || '').trim();
  const { contrasena, rol } = req.body;
  const specialty = String(req.body.specialty || '').trim();

  if (nombre.length < 3 || !correo || !contrasena || !rol) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }
  if (!STAFF_ROLES.some(r => r.code === rol)) {
    return res.status(400).json({ message: 'Rol no válido' });
  }
  if (!EMAIL_PATTERN.test(correo)) {
    return res.status(400).json({ message: 'El correo debe ser una cuenta @gmail.com válida' });
  }
  if (!PASSWORD_PATTERN.test(contrasena)) {
    return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número' });
  }
  if (telefono && !PHONE_PATTERN.test(telefono)) {
    return res.status(400).json({ message: 'El teléfono debe tener 10 dígitos y empezar por 3' });
  }

  const users = router.db.get('users');
  if (users.find(u => String(u.correo).toLowerCase() === correo).value()) {
    return res.status(409).json({ message: 'Este correo ya está registrado' });
  }

  const createdAt = nowLocalIso();
  const newUser = {
    id: nextIdOf('users'),
    nombre,
    correo,
    telefono: telefono || null,
    contrasena,
    iniciales: initialsFor(nombre),
    rol,
    // el personal no pasa por el registro público; la aceptación queda a cargo del contrato laboral
    aceptaTerminos: true,
    aceptaPoliticaDatos: true,
    isActive: true,
    createdAt,
    createdBy: req.user.id
  };
  users.push(newUser).write();

  if (rol === 'OPERATOR') {
    const operatorId = nextIdOf('operators');

    router.db
      .get('operators')
      .push({
        id: operatorId,
        userId: newUser.id,
        hiredOn: createdAt.slice(0, 10),
        isActive: true,
        specialty: specialty || 'Operario de lavado',
        rating: null,
        totalServices: 0,
        tags: [],
        featured: false,
        punctuality: 100,
        weeklyRevenueGoal: 300000,
        certifications: []
      })
      .write();

    const availability = router.db.get('operatorAvailability');
    let nextAvailabilityId = nextIdOf('operatorAvailability');
    for (const slot of DEFAULT_OPERATOR_WEEK) {
      availability.push({ id: nextAvailabilityId, operatorId, ...slot, isActive: true }).write();
      nextAvailabilityId += 1;
    }
  }

  pushNotification(newUser.id, {
    code: 'SISTEMA',
    type: 'sistema',
    icon: 'waving_hand',
    title: 'Bienvenido a LavaRápido',
    desc: 'Tu cuenta fue creada por un administrador. Te recomendamos cambiar tu contraseña.'
  });

  res.status(201).json(computeStaffUser(newUser));
});

// Habilitar / inhabilitar: /login ya rechaza (403) las cuentas con isActive = false.
server.patch('/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const user = router.db.get('users').find({ id: Number(req.params.id) }).value();

  if (!user || !STAFF_ROLES.some(r => r.code === user.rol)) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  if (typeof req.body.isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive debe ser true o false' });
  }
  if (user.id === req.user.id && req.body.isActive === false) {
    return res.status(409).json({ message: 'No puedes inhabilitar tu propia cuenta' });
  }

  router.db.get('users').find({ id: user.id }).assign({ isActive: req.body.isActive }).write();

  const operator = router.db.get('operators').find({ userId: user.id });
  if (operator.value()) operator.assign({ isActive: req.body.isActive }).write();

  res.status(200).json(computeStaffUser(router.db.get('users').find({ id: user.id }).value()));
});

// Borrado físico solo si la cuenta no tiene historial; si lo tiene, se inhabilita en su lugar.
server.delete('/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const user = router.db.get('users').find({ id: Number(req.params.id) }).value();

  if (!user || !STAFF_ROLES.some(r => r.code === user.rol)) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  if (user.id === req.user.id) {
    return res.status(409).json({ message: 'No puedes eliminar tu propia cuenta' });
  }

  const operator = router.db.get('operators').find({ userId: user.id }).value();
  const hasHistory = operator && router.db.get('serviceExecutions').find({ operatorId: operator.id }).value();

  if (hasHistory) {
    return res.status(409).json({ message: 'Este operario tiene servicios registrados; inhabilítalo en lugar de eliminarlo' });
  }

  if (operator) {
    router.db.get('operatorAvailability').remove({ operatorId: operator.id }).write();
    router.db.get('operatorAbsence').remove({ operatorId: operator.id }).write();
    router.db.get('operators').remove({ id: operator.id }).write();
  }
  router.db.get('notifications').remove({ userId: user.id }).write();
  router.db.get('users').remove({ id: user.id }).write();

  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Admin > Reservas: listado por día y asignación de operario.
// ---------------------------------------------------------------------------

server.get('/admin/bookings', requireAuth, requireAdmin, (req, res) => {
  const date = String(req.query.date || '');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Fecha inválida (formato yyyy-mm-dd)' });
  }
  res.status(200).json(computeAdminBookings(router.db, date || null));
});

function findBookingOr404(req, res) {
  const booking = router.db.get('bookings').find({ id: Number(req.params.id) }).value();
  if (!booking) {
    res.status(404).json({ message: 'Reserva no encontrada' });
    return null;
  }
  return booking;
}

server.get('/admin/bookings/:id/operator-options', requireAuth, requireAdmin, (req, res) => {
  const booking = findBookingOr404(req, res);
  if (!booking) return;
  res.status(200).json(computeOperatorOptions(router.db, booking));
});

// Asigna (o reasigna, si aún no empezó) el operario: crea/actualiza sus service_execution,
// confirma la reserva, le asigna una bahía libre si no tenía y avisa a operario y cliente.
server.post('/admin/bookings/:id/assign', requireAuth, requireAdmin, (req, res) => {
  const booking = findBookingOr404(req, res);
  if (!booking) return;

  const statusCode = (router.db.get('bookingStatuses').find({ id: booking.bookingStatusId }).value() || {}).code;
  if (['COMPLETED', 'CANCELLED', 'NO_SHOW', 'IN_PROGRESS'].includes(statusCode)) {
    return res.status(409).json({ message: 'Esta reserva ya no admite cambios de operario' });
  }

  const option = computeOperatorOptions(router.db, booking).find(o => o.id === req.body.operatorId);
  if (!option) {
    return res.status(404).json({ message: 'Operario no encontrado' });
  }
  if (option.availability !== 'available') {
    return res.status(409).json({ message: `El operario no está disponible: ${option.availabilityNote || ''}`.trim() });
  }

  const operatorId = Number(String(req.body.operatorId).replace(/^OP-/, ''));
  const previous = assignedOperatorRow(router.db, booking.id);
  const bookingServices = router.db.get('bookingServices').filter({ bookingId: booking.id }).value();
  const executions = router.db.get('serviceExecutions');
  const pendingExec = statusIdOf('executionStatuses', 'PENDING');

  for (const bs of bookingServices) {
    const existing = executions.find({ bookingServiceId: bs.id });
    if (existing.value()) {
      existing.assign({ operatorId }).write();
    } else {
      executions
        .push({
          id: nextIdOf('serviceExecutions'),
          bookingServiceId: bs.id,
          operatorId,
          executionStatusId: pendingExec,
          startedAt: null,
          finishedAt: null,
          qualityRating: null,
          qualityComment: null,
          ratedAt: null,
          isCommentVisible: true
        })
        .write();
    }
  }

  const changes = {};
  if (statusCode === 'PENDING') changes.bookingStatusId = statusIdOf('bookingStatuses', 'CONFIRMED');
  if (typeof req.body.notes === 'string' && req.body.notes.trim()) changes.adminNotes = req.body.notes.trim();

  // Bahía: la primera activa que no esté ocupada en esa franja.
  if (!booking.serviceBayId) {
    const cancelledIds = router.db.get('bookingStatuses').value().filter(s => ['CANCELLED', 'NO_SHOW'].includes(s.code)).map(s => s.id);
    const busyBayIds = router.db
      .get('bookings')
      .value()
      .filter(b => b.id !== booking.id && b.serviceBayId && !cancelledIds.includes(b.bookingStatusId))
      .filter(b => b.scheduledStart < booking.scheduledEnd && booking.scheduledStart < b.scheduledEnd)
      .map(b => b.serviceBayId);
    const freeBay = router.db.get('serviceBays').value().find(bay => bay.isActive && !busyBayIds.includes(bay.id));
    if (freeBay) changes.serviceBayId = freeBay.id;
  }

  if (Object.keys(changes).length) router.db.get('bookings').find({ id: booking.id }).assign(changes).write();

  const when = `${booking.scheduledStart.slice(0, 10)} a las ${booking.scheduledStart.slice(11, 16)}`;
  const operatorUser = router.db.get('users').find({ id: router.db.get('operators').find({ id: operatorId }).value().userId }).value();

  pushNotification(operatorUser.id, {
    code: 'RECORDATORIO',
    type: 'recordatorio',
    icon: 'assignment',
    title: 'Nuevo servicio asignado',
    desc: `Se te asignó la reserva ${booking.code} para el ${when}.`,
    referenceEntity: 'booking',
    referenceId: booking.id
  });

  if (previous && previous.id !== operatorId) {
    pushNotification(previous.userId, {
      code: 'CANCELACION',
      type: 'cancelacion',
      icon: 'event_busy',
      title: 'Servicio reasignado',
      desc: `La reserva ${booking.code} fue reasignada a otro operario.`,
      referenceEntity: 'booking',
      referenceId: booking.id
    });
  }

  const ctx = getBookingContext(router.db, booking.id);
  if (ctx && ctx.customerUser && (!previous || previous.id !== operatorId)) {
    pushNotification(ctx.customerUser.id, {
      code: previous ? 'MENSAJE' : 'CONFIRMACION',
      type: previous ? 'mensaje' : 'confirmacion',
      icon: previous ? 'swap_horiz' : 'event_available',
      title: previous ? 'Cambio de operario' : 'Reserva confirmada',
      desc: previous
        ? `Tu reserva ${booking.code} del ${when} ahora la atenderá ${operatorUser.nombre}.`
        : `Tu reserva ${booking.code} para el ${when} fue confirmada. Te atenderá ${operatorUser.nombre}.`,
      referenceEntity: 'booking',
      referenceId: booking.id
    });
  }

  res.status(200).json(computeAdminBooking(router.db, router.db.get('bookings').find({ id: booking.id }).value()));
});

// ---------------------------------------------------------------------------
// Admin > Pagos: verificación de comprobantes y registro manual (pago en sede).
// ---------------------------------------------------------------------------

server.get('/admin/payments', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(computeAdminPayments(router.db));
});

server.get('/admin/payments/payable-bookings', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ bookings: computeAdminPayableBookings(router.db), methods: computePaymentMethods(router.db) });
});

// Aprueba o rechaza un pago en revisión; el cliente recibe la notificación con el resultado.
server.post('/admin/payments/:id/review', requireAuth, requireAdmin, (req, res) => {
  const payment = router.db.get('payments').find({ id: Number(req.params.id) }).value();
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

  const current = router.db.get('paymentStatuses').find({ id: payment.paymentStatusId }).value();
  if (!current || current.code !== 'PENDING') {
    return res.status(409).json({ message: 'Este pago ya fue revisado' });
  }

  const { action } = req.body;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ message: 'Acción no válida' });
  }
  if (action === 'rejected' && !reason) {
    return res.status(400).json({ message: 'Debes indicar el motivo del rechazo' });
  }

  const reviewedAt = nowLocalIso();
  router.db
    .get('payments')
    .find({ id: payment.id })
    .assign({
      paymentStatusId: statusIdOf('paymentStatuses', action === 'approved' ? 'APPROVED' : 'REJECTED'),
      processedAt: reviewedAt,
      approvedBy: req.user.id,
      rejectionReason: action === 'rejected' ? reason : null
    })
    .write();

  const receipt = router.db.get('paymentReceipts').find({ paymentId: payment.id });
  if (receipt.value()) {
    receipt.assign({ reviewedAt, reviewedBy: req.user.id, reviewComment: action === 'approved' ? 'Verificado' : reason }).write();
  }

  const booking = router.db.get('bookings').find({ id: payment.bookingId }).value();
  const ctx = booking ? getBookingContext(router.db, booking.id) : null;
  if (ctx && ctx.customerUser) {
    pushNotification(ctx.customerUser.id, action === 'approved'
      ? {
          code: 'CONFIRMACION', type: 'confirmacion', icon: 'paid', title: 'Pago aprobado',
          desc: `Verificamos tu pago de la reserva ${booking.code}. ¡Gracias!`, referenceEntity: 'payment', referenceId: payment.id
        }
      : {
          code: 'CANCELACION', type: 'cancelacion', icon: 'money_off', title: 'Pago rechazado',
          desc: `Tu pago de la reserva ${booking.code} fue rechazado: ${reason}. Puedes volver a pagarla desde "Pagar servicio".`,
          referenceEntity: 'payment', referenceId: payment.id
        });
  }

  res.status(200).json(computeAdminPayment(router.db, router.db.get('payments').find({ id: payment.id }).value()));
});

// Pago recibido en sede (efectivo/datáfono/transferencia vista por el admin): queda aprobado de una.
server.post('/admin/payments', requireAuth, requireAdmin, (req, res) => {
  const booking = router.db.get('bookings').find({ id: Number(req.body.bookingId) }).value();
  if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });

  if (!computeAdminPayableBookings(router.db).some(b => b.bookingId === booking.id)) {
    return res.status(409).json({ message: 'Esta reserva ya tiene un pago aprobado o en revisión' });
  }

  const account = router.db.get('paymentAccounts').find({ id: Number(req.body.paymentAccountId), isActive: true }).value();
  if (!account) return res.status(400).json({ message: 'Método de pago no válido' });

  const now = nowLocalIso();
  const newPayment = {
    id: nextIdOf('payments'),
    bookingId: booking.id,
    paymentAccountId: account.id,
    paymentStatusId: statusIdOf('paymentStatuses', 'APPROVED'),
    amount: computeBooking(router.db, booking).price,
    processedAt: now,
    approvedBy: req.user.id,
    rejectionReason: null,
    createdAt: now
  };
  router.db.get('payments').push(newPayment).write();

  const reference = typeof req.body.reference === 'string' ? req.body.reference.trim() : '';
  if (reference) {
    router.db
      .get('paymentReceipts')
      .push({
        id: nextIdOf('paymentReceipts'),
        paymentId: newPayment.id,
        fileUrl: null,
        transactionReference: reference,
        reportedAmount: newPayment.amount,
        uploadedAt: now,
        uploadedBy: req.user.id,
        reviewedAt: now,
        reviewedBy: req.user.id,
        reviewComment: 'Registrado manualmente por el administrador'
      })
      .write();
  }

  res.status(201).json(computeAdminPayment(router.db, newPayment));
});

server.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(computeAdminDashboard(router.db, req.user));
});

// ---------------------------------------------------------------------------
// Admin > Horarios. Lo que se guarda aquí lo usa /availability, así que cambia
// las franjas que el cliente ve al reservar.
// ---------------------------------------------------------------------------

const TIME_PATTERN = /^\d{2}:\d{2}$/;

function logScheduleChange(req, description) {
  if (!router.db.get('scheduleChangeLog').value()) router.db.set('scheduleChangeLog', []).write();
  router.db
    .get('scheduleChangeLog')
    .push({ id: nextIdOf('scheduleChangeLog'), author: req.user.nombre, description, createdAt: nowLocalIso() })
    .write();
}

server.get('/admin/schedule', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(computeAdminSchedule(router.db));
});

server.put('/admin/schedule/hours', requireAuth, requireAdmin, (req, res) => {
  const days = Array.isArray(req.body.days) ? req.body.days : [];
  if (days.length !== 7) return res.status(400).json({ message: 'Se esperan los 7 días de la semana' });

  for (const d of days) {
    if (!DAY_KEYS.includes(d.key)) return res.status(400).json({ message: `Día no válido: ${d.key}` });
    if (d.isWorking && (!TIME_PATTERN.test(d.openTime) || !TIME_PATTERN.test(d.closeTime) || d.openTime >= d.closeTime)) {
      return res.status(400).json({ message: 'La hora de apertura debe ser menor que la de cierre' });
    }
  }

  const changed = [];
  for (const d of days) {
    const dayOfWeek = DAY_KEYS.indexOf(d.key) + 1;
    const row = router.db.get('businessHours').find({ dayOfWeek });
    const before = row.value();
    const next = {
      isActive: !!d.isWorking,
      opensAt: d.isWorking ? d.openTime : '00:00',
      closesAt: d.isWorking ? d.closeTime : '00:00',
      pause: d.pause === 'lunch' ? 'lunch' : 'none'
    };

    if (!before) {
      router.db.get('businessHours').push({ id: nextIdOf('businessHours'), dayOfWeek, ...next }).write();
      changed.push(d.key);
    } else if (before.isActive !== next.isActive || before.opensAt !== next.opensAt || before.closesAt !== next.closesAt || (before.pause || 'none') !== next.pause) {
      row.assign(next).write();
      changed.push(d.key);
    }
  }

  if (changed.length) {
    const names = { monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles', thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo' };
    logScheduleChange(req, `Se actualizó el horario de: ${changed.map(k => names[k]).join(', ')}`);
  }

  res.status(200).json(computeAdminSchedule(router.db));
});

function exceptionFromBody(body) {
  const closed = !!body.closedAllDay;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ''))) return { error: 'Fecha inválida' };
  if (!String(body.reason || '').trim()) return { error: 'El motivo es obligatorio' };
  if (!closed && (!TIME_PATTERN.test(body.openTime) || !TIME_PATTERN.test(body.closeTime) || body.openTime >= body.closeTime)) {
    return { error: 'La hora de apertura debe ser menor que la de cierre' };
  }
  return {
    row: {
      exceptionDate: body.date,
      isClosed: closed,
      opensAt: closed ? null : body.openTime,
      closesAt: closed ? null : body.closeTime,
      reason: String(body.reason).trim()
    }
  };
}

server.post('/admin/schedule/exceptions', requireAuth, requireAdmin, (req, res) => {
  const { row, error } = exceptionFromBody(req.body);
  if (error) return res.status(400).json({ message: error });
  if (router.db.get('businessHourExceptions').find({ exceptionDate: row.exceptionDate }).value()) {
    return res.status(409).json({ message: 'Ya existe una excepción para esa fecha' });
  }

  router.db.get('businessHourExceptions').push({ id: nextIdOf('businessHourExceptions'), ...row }).write();
  logScheduleChange(req, `Se agregó la excepción '${row.reason}' (${row.exceptionDate})`);
  res.status(201).json(computeAdminSchedule(router.db));
});

server.put('/admin/schedule/exceptions/:id', requireAuth, requireAdmin, (req, res) => {
  const current = router.db.get('businessHourExceptions').find({ id: Number(req.params.id) });
  if (!current.value()) return res.status(404).json({ message: 'Excepción no encontrada' });

  const { row, error } = exceptionFromBody(req.body);
  if (error) return res.status(400).json({ message: error });
  const clash = router.db.get('businessHourExceptions').find({ exceptionDate: row.exceptionDate }).value();
  if (clash && clash.id !== current.value().id) {
    return res.status(409).json({ message: 'Ya existe una excepción para esa fecha' });
  }

  current.assign(row).write();
  logScheduleChange(req, `Se modificó la excepción '${row.reason}' (${row.exceptionDate})`);
  res.status(200).json(computeAdminSchedule(router.db));
});

server.delete('/admin/schedule/exceptions/:id', requireAuth, requireAdmin, (req, res) => {
  const current = router.db.get('businessHourExceptions').find({ id: Number(req.params.id) }).value();
  if (!current) return res.status(404).json({ message: 'Excepción no encontrada' });

  router.db.get('businessHourExceptions').remove({ id: current.id }).write();
  logScheduleChange(req, `Se eliminó la excepción '${current.reason}' (${current.exceptionDate})`);
  res.status(200).json(computeAdminSchedule(router.db));
});

// Estado de una bahía: solo las "active" cuentan para disponibilidad y asignación.
server.patch('/admin/schedule/bays/:id', requireAuth, requireAdmin, (req, res) => {
  const bay = router.db.get('serviceBays').find({ id: Number(req.params.id) });
  if (!bay.value()) return res.status(404).json({ message: 'Bahía no encontrada' });

  const status = req.body.status;
  if (!['active', 'maintenance', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  bay.assign({ status, isActive: status === 'active' }).write();
  const labels = { active: 'activa', maintenance: 'en mantenimiento', inactive: 'inactiva' };
  logScheduleChange(req, `${bay.value().name} pasó a ${labels[status]}`);
  res.status(200).json(computeAdminSchedule(router.db));
});

server.get('/admin/reports', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(computeAdminReports(router.db));
});

// ---------------------------------------------------------------------------
// Admin > Configuración: datos del negocio (establishment) y métodos de pago
// (payment_account + payment_method_type). Lo que se desactiva aquí deja de
// aparecer en "Pagar servicio" del cliente.
// ---------------------------------------------------------------------------

// Campos de la pantalla que viven en establishment (los del SQL + extras del mock).
const BUSINESS_FIELDS = [
  'legalName', 'tradeName', 'taxId', 'businessType', 'foundationDate', 'legalRep', 'legalRepDoc',
  'address', 'phone', 'whatsapp', 'email', 'website',
  'taxRegime', 'ciiuActivity', 'dianResolution', 'invoicePrefix', 'invoiceRange', 'electronicInvoicing',
  'instagram', 'facebook', 'supportLine', 'serviceHours'
];

function businessData() {
  const row = router.db.get('establishment').value()[0] || {};
  const data = {};
  for (const field of BUSINESS_FIELDS) {
    data[field] = field === 'electronicInvoicing' ? !!row[field] : row[field] ?? '';
  }
  return data;
}

server.get('/admin/establishment', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(businessData());
});

server.put('/admin/establishment', requireAuth, requireAdmin, (req, res) => {
  const body = req.body || {};
  for (const required of ['legalName', 'taxId', 'address', 'phone']) {
    if (!String(body[required] || '').trim()) {
      return res.status(400).json({ message: 'Razón social, NIT, dirección y teléfono son obligatorios' });
    }
  }

  const changes = {};
  for (const field of BUSINESS_FIELDS) {
    if (!(field in body)) continue;
    changes[field] = field === 'electronicInvoicing' ? !!body[field] : String(body[field] ?? '').trim();
  }

  const establishments = router.db.get('establishment');
  if (!establishments.value().length) {
    establishments.push({ id: 1, logoUrl: null, ...changes }).write();
  } else {
    establishments.find({ id: establishments.value()[0].id }).assign(changes).write();
  }

  res.status(200).json(businessData());
});

function paymentAccountView(account) {
  const type = router.db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value() || {};
  return {
    id: String(account.id),
    code: String(type.code || '').toLowerCase(),
    name: type.name || '',
    type: account.instructions || '',
    holder: account.accountHolder,
    accountNumber: account.accountNumber || '',
    active: !!account.isActive,
    needsQr: !!type.requiresReceipt,
    qrFileName: account.qrImageUrl || undefined
  };
}

server.get('/admin/payment-accounts', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(router.db.get('paymentAccounts').value().map(paymentAccountView));
});

// Activar/desactivar o registrar el nombre del QR. Siempre debe quedar al menos un método activo.
server.patch('/admin/payment-accounts/:id', requireAuth, requireAdmin, (req, res) => {
  const account = router.db.get('paymentAccounts').find({ id: Number(req.params.id) });
  if (!account.value()) return res.status(404).json({ message: 'Método de pago no encontrado' });

  const changes = {};
  if (typeof req.body.active === 'boolean') {
    const othersActive = router.db.get('paymentAccounts').value().filter(a => a.isActive && a.id !== account.value().id).length;
    if (!req.body.active && othersActive === 0) {
      return res.status(409).json({ message: 'Debe quedar al menos un método de pago activo' });
    }
    changes.isActive = req.body.active;
  }
  // el mock no almacena archivos: solo guarda el nombre del QR elegido
  if (typeof req.body.qrFileName === 'string') changes.qrImageUrl = req.body.qrFileName.trim() || null;

  account.assign(changes).write();
  res.status(200).json(paymentAccountView(account.value()));
});

server.post('/admin/payment-accounts', requireAuth, requireAdmin, (req, res) => {
  const name = String(req.body.name || '').trim();
  const holder = String(req.body.holder || '').trim();
  if (!name || !holder) return res.status(400).json({ message: 'Nombre y titular son obligatorios' });

  const code = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  let methodType = router.db.get('paymentMethodTypes').find({ code }).value();
  if (!methodType) {
    methodType = { id: nextIdOf('paymentMethodTypes'), code, name, requiresAccount: true, requiresReceipt: true, isActive: true };
    router.db.get('paymentMethodTypes').push(methodType).write();
  }

  const account = {
    id: nextIdOf('paymentAccounts'),
    paymentMethodTypeId: methodType.id,
    accountHolder: holder,
    accountNumber: String(req.body.accountNumber || '').trim() || null,
    qrImageUrl: null,
    instructions: String(req.body.type || '').trim() || null,
    isActive: true
  };
  router.db.get('paymentAccounts').push(account).write();

  res.status(201).json(paymentAccountView(account));
});

// Computed read-models: registered BEFORE `server.use(router)` so they take precedence
// over json-server's default flat REST handling for the same paths. These simulate what a
// real backend's aggregation layer would return (agenda, today's services, weekly KPIs, etc.)
// instead of storing pre-baked derived data in db.json.
server.get('/operators', (req, res) => {
  res.status(200).json(computeOperators(router.db));
});

server.get('/operators/:id', (req, res) => {
  const operator = computeOperatorById(router.db, req.params.id);

  if (!operator) {
    return res.status(404).json({ message: 'Operario no encontrado' });
  }

  res.status(200).json(operator);
});

server.use(router);

server.listen(3000, () => {
  console.log('Mock API running on http://localhost:3000');
});
