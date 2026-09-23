// Read-model builders for the mock API: joins several flat json-server collections into the
// richer shapes the frontend expects (operator agenda, today's services, etc.), simulating
// what a real backend's query/aggregation layer would return. Pure functions, no writes.

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 'Ahora' en la misma convención del db.json (hora local con sufijo Z), para comparar
// contra scheduledStart/scheduledEnd sin el desfase de 5 horas de Bogotá.
function localNow() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
}

function formatTime(iso) {
  return iso.slice(11, 16);
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateEs(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function hoursBetweenTimes(t1, t2) {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
}

function hoursBetweenDates(d1, d2) {
  return (new Date(d2) - new Date(d1)) / 3600000;
}

function getUser(db, userId) {
  return db.get('users').find({ id: userId }).value();
}

function getBookingContext(db, bookingId) {
  const booking = db.get('bookings').find({ id: bookingId }).value();
  if (!booking) return null;

  const vehicle = db.get('vehicles').find({ id: booking.vehicleId }).value();
  const customer = vehicle ? db.get('customers').find({ id: vehicle.customerId }).value() : null;
  const customerUser = customer ? getUser(db, customer.userId) : null;
  const vehicleType = vehicle ? db.get('vehicleTypes').find({ id: vehicle.vehicleTypeId }).value() : null;
  const bay = booking.serviceBayId ? db.get('serviceBays').find({ id: booking.serviceBayId }).value() : null;
  const status = db.get('bookingStatuses').find({ id: booking.bookingStatusId }).value();

  return { booking, vehicle, vehicleType, customer, customerUser, bay, status };
}

function getServiceInfo(db, servicePriceId) {
  const servicePrice = db.get('servicePrices').find({ id: servicePriceId }).value();
  if (!servicePrice) return { name: 'Servicio', price: 0 };

  const service = db.get('services').find({ id: servicePrice.serviceId }).value();
  return { name: service ? service.name : 'Servicio', price: servicePrice.price, service, servicePrice };
}

function executionStatusLabel(db, executionStatusId) {
  const status = db.get('executionStatuses').find({ id: executionStatusId }).value();
  if (!status) return 'scheduled';
  if (status.code === 'COMPLETED') return 'completed';
  if (status.code === 'IN_PROGRESS') return 'in_progress';
  return 'scheduled';
}

function enrichExecutions(db, operatorId) {
  const executions = db.get('serviceExecutions').filter({ operatorId }).value();

  return executions
    .map(execution => {
      const bookingService = db.get('bookingServices').find({ id: execution.bookingServiceId }).value();
      const ctx = bookingService ? getBookingContext(db, bookingService.bookingId) : null;
      const svc = bookingService ? getServiceInfo(db, bookingService.servicePriceId) : null;
      return { execution, bookingService, ctx, svc };
    })
    .filter(entry => entry.ctx && entry.svc);
}

function buildCalendarBlocks(db, operatorRow, enrichedExecutions, weekStart) {
  const blocks = [];
  const availabilityRows = db
    .get('operatorAvailability')
    .filter({ operatorId: operatorRow.id, isActive: true })
    .value();
  const absences = db.get('operatorAbsence').filter({ operatorId: operatorRow.id }).value();

  for (let dayIdx = 0; dayIdx <= 5; dayIdx++) {
    // schema dayOfWeek: 1=Mon..7=Sun. UI shows Mon..Sat only (dayIdx 0..5).
    const sqlDayOfWeek = dayIdx + 1;
    const dateForDay = new Date(weekStart);
    dateForDay.setDate(dateForDay.getDate() + dayIdx);
    const dateStr = dateForDay.toISOString().slice(0, 10);

    const absence = absences.find(a => dateStr >= a.startsAt.slice(0, 10) && dateStr <= a.endsAt.slice(0, 10));
    if (absence) {
      blocks.push({ day: dayIdx, startTime: '08:00', endTime: '18:00', type: 'leave', label: absence.reason });
      continue;
    }

    const avail = availabilityRows.find(a => a.dayOfWeek === sqlDayOfWeek);
    if (!avail) continue;

    const pushGap = (from, to) => {
      if (from >= to) return;

      if (from < '13:00' && to > '13:00') {
        pushGap(from, '13:00');
        const lunchEnd = to < '14:00' ? to : '14:00';
        blocks.push({ day: dayIdx, startTime: '13:00', endTime: lunchEnd, type: 'lunch', label: 'Almuerzo' });
        if (to > '14:00') pushGap('14:00', to);
        return;
      }

      blocks.push({ day: dayIdx, startTime: from, endTime: to, type: 'available', label: 'Disponible' });
    };

    const dayServices = enrichedExecutions
      .filter(e => e.ctx.booking.scheduledStart.slice(0, 10) === dateStr)
      .sort((a, b) => a.ctx.booking.scheduledStart.localeCompare(b.ctx.booking.scheduledStart));

    let cursor = avail.startsAt;

    for (const e of dayServices) {
      const start = formatTime(e.ctx.booking.scheduledStart);
      const end = formatTime(e.ctx.booking.scheduledEnd);
      if (start > cursor) pushGap(cursor, start);

      blocks.push({
        day: dayIdx,
        startTime: start,
        endTime: end,
        type: 'service',
        label: `${e.ctx.booking.code} · ${e.ctx.vehicle.brand} ${e.ctx.vehicle.model} · ${e.svc.name}`,
        bay: e.ctx.bay ? e.ctx.bay.name : undefined
      });

      if (end > cursor) cursor = end;
    }

    if (cursor < avail.endsAt) pushGap(cursor, avail.endsAt);
  }

  return blocks;
}

function computeOperator(db, operatorRow, referenceDate = new Date()) {
  const user = getUser(db, operatorRow.userId);
  const weekStart = startOfWeek(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const enriched = enrichExecutions(db, operatorRow.id);

  const inRange = (dateStr, from, to) => {
    const d = new Date(dateStr);
    return d >= from && d <= to;
  };

  const thisWeek = enriched.filter(e => inRange(e.ctx.booking.scheduledStart, weekStart, weekEnd));
  const lastWeek = enriched.filter(e => inRange(e.ctx.booking.scheduledStart, prevWeekStart, weekStart));

  const weeklyServices = thisWeek.length;
  const weeklyServicesChange =
    lastWeek.length > 0
      ? Math.round(((weeklyServices - lastWeek.length) / lastWeek.length) * 100)
      : weeklyServices > 0
        ? 100
        : 0;

  const weeklyRevenue = thisWeek.reduce(
    (sum, e) => sum + e.svc.price * (e.bookingService.quantity || 1),
    0
  );
  const weeklyGoalPercent = operatorRow.weeklyRevenueGoal
    ? Math.round((weeklyRevenue / operatorRow.weeklyRevenueGoal) * 100)
    : 0;

  const reviewsCount = db
    .get('serviceExecutions')
    .filter({ operatorId: operatorRow.id })
    .value()
    .filter(e => e.qualityRating != null).length;

  const now = referenceDate;
  const activeAbsence = db
    .get('operatorAbsence')
    .filter({ operatorId: operatorRow.id })
    .value()
    .find(a => new Date(a.startsAt) <= now && now <= new Date(a.endsAt));

  const currentExec = enriched.find(e => {
    const start = new Date(e.ctx.booking.scheduledStart);
    const end = new Date(e.ctx.booking.scheduledEnd);
    return now >= start && now <= end && executionStatusLabel(db, e.execution.executionStatusId) !== 'completed';
  });

  let status = 'available';
  let bay = null;
  if (activeAbsence) {
    status = 'medical_leave';
  } else if (currentExec) {
    status = 'in_service';
    bay = currentExec.ctx.bay ? currentExec.ctx.bay.name : null;
  }

  const availabilityRows = db
    .get('operatorAvailability')
    .filter({ operatorId: operatorRow.id, isActive: true })
    .value();
  const totalHours = availabilityRows.reduce((sum, a) => sum + hoursBetweenTimes(a.startsAt, a.endsAt), 0);
  const bookedHours = thisWeek.reduce(
    (sum, e) => sum + hoursBetweenDates(e.ctx.booking.scheduledStart, e.ctx.booking.scheduledEnd),
    0
  );
  const availableHours = Math.max(0, Math.round((totalHours - bookedHours) * 10) / 10);

  const todayStr = now.toISOString().slice(0, 10);
  const todayServices = enriched
    .filter(e => e.ctx.booking.scheduledStart.slice(0, 10) === todayStr)
    .sort((a, b) => a.ctx.booking.scheduledStart.localeCompare(b.ctx.booking.scheduledStart))
    .map(e => ({
      code: e.ctx.booking.code,
      vehicle: `${e.ctx.vehicle.brand} ${e.ctx.vehicle.model}`,
      service: e.svc.name,
      bay: e.ctx.bay ? e.ctx.bay.name : '—',
      time: `${formatTime(e.ctx.booking.scheduledStart)} - ${formatTime(e.ctx.booking.scheduledEnd)}`,
      status: executionStatusLabel(db, e.execution.executionStatusId)
    }));

  const calendarBlocks = buildCalendarBlocks(db, operatorRow, enriched, weekStart);

  return {
    id: `OP-${operatorRow.id}`,
    userId: operatorRow.userId,
    name: user ? user.nombre : 'Operario',
    initials: user ? user.iniciales : '',
    specialty: operatorRow.specialty || '',
    rating: operatorRow.rating ?? 0, // operario recién creado: aún sin calificaciones
    reviewsCount,
    status,
    bay,
    weeklyServices,
    weeklyServicesChange,
    tags: operatorRow.tags || [],
    featured: !!operatorRow.featured,
    phone: user ? user.telefono : '',
    email: user ? user.correo : '',
    availableHours,
    totalHours: Math.round(totalHours * 10) / 10,
    punctuality: operatorRow.punctuality ?? 100,
    weeklyRevenue,
    weeklyGoalPercent,
    certifications: operatorRow.certifications,
    todayServices,
    calendarBlocks
  };
}

function computeOperators(db, referenceDate = new Date()) {
  // Los inhabilitados desde Gestión no aparecen en la lista ni se pueden asignar.
  return db
    .get('operators')
    .value()
    .filter(row => row.isActive !== false)
    .map(row => computeOperator(db, row, referenceDate));
}

function computeOperatorById(db, id, referenceDate = new Date()) {
  const numericId = Number(String(id).replace(/^OP-/, ''));
  const row = db.get('operators').find({ id: numericId }).value();
  return row ? computeOperator(db, row, referenceDate) : null;
}

// ---------------------------------------------------------------------------
// Client-facing read models: vehicles, bookings, payments, notifications.
// ---------------------------------------------------------------------------

function getCustomerByUserId(db, userId) {
  return db.get('customers').find({ userId }).value();
}

function computeVehicle(db, vehicleRow) {
  const vehicleType = db.get('vehicleTypes').find({ id: vehicleRow.vehicleTypeId }).value();
  const completedStatus = db.get('bookingStatuses').find({ code: 'COMPLETED' }).value();

  const completed = db
    .get('bookings')
    .filter({ vehicleId: vehicleRow.id, bookingStatusId: completedStatus ? completedStatus.id : -1 })
    .value()
    .sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart));

  const lastBooking = completed[0];
  let lastServiceCode = null;

  if (lastBooking) {
    const bookingService = db.get('bookingServices').find({ bookingId: lastBooking.id }).value();
    if (bookingService) {
      const info = getServiceInfo(db, bookingService.servicePriceId);
      lastServiceCode = info.service ? info.service.code : null;
    }
  }

  return {
    id: vehicleRow.id,
    type: vehicleType ? vehicleType.code : 'CAR',
    brand: vehicleRow.brand,
    model: vehicleRow.model,
    plate: vehicleRow.licensePlate,
    color: vehicleRow.color,
    lastWash: lastBooking ? formatDateEs(lastBooking.scheduledStart) : null,
    lastWashAt: lastBooking ? lastBooking.scheduledStart : null, // ISO, para ordenar
    service: lastServiceCode,
    totalWashes: completed.length
  };
}

function computeVehiclesForCustomer(db, customerId) {
  return db
    .get('vehicles')
    .filter({ customerId })
    .value()
    .map(v => computeVehicle(db, v));
}

function computeBooking(db, bookingRow) {
  const ctx = getBookingContext(db, bookingRow.id);
  if (!ctx) return null;

  const bookingServiceRows = db.get('bookingServices').filter({ bookingId: bookingRow.id }).value();
  const services = bookingServiceRows.map(bs => {
    const info = getServiceInfo(db, bs.servicePriceId);
    return {
      code: info.service ? info.service.code : null,
      name: info.name,
      price: info.price,
      quantity: bs.quantity
    };
  });

  const price =
    services.reduce((sum, s) => sum + s.price * s.quantity, 0) - (bookingRow.pointsDiscountAmount || 0);

  const executions = bookingServiceRows
    .map(bs => db.get('serviceExecutions').find({ bookingServiceId: bs.id }).value())
    .filter(Boolean);
  const firstExecution = executions[0];
  const operator = firstExecution
    ? db.get('operators').find({ id: firstExecution.operatorId }).value()
    : null;
  const operatorUser = operator ? getUser(db, operator.userId) : null;

  // Último intento de pago: si uno fue rechazado y el cliente volvió a pagar, manda el más reciente.
  const payment = latestPaymentForBooking(db, bookingRow.id);
  const paymentStatus = payment ? db.get('paymentStatuses').find({ id: payment.paymentStatusId }).value() : null;

  let progress = 0;
  const statusCode = ctx.status ? ctx.status.code : null;
  if (statusCode === 'COMPLETED') {
    progress = 100;
  } else if (statusCode === 'IN_PROGRESS') {
    const start = new Date(bookingRow.scheduledStart);
    const end = new Date(bookingRow.scheduledEnd);
    const now = localNow();
    progress = Math.min(95, Math.max(5, Math.round(((now - start) / (end - start)) * 100)));
  } else if (statusCode === 'CONFIRMED') {
    progress = 10;
  }

  return {
    id: bookingRow.id,
    code: bookingRow.code,
    status: statusCode,
    scheduledStart: bookingRow.scheduledStart,
    scheduledEnd: bookingRow.scheduledEnd,
    date: formatDateShort(bookingRow.scheduledStart),
    time: formatTime(bookingRow.scheduledStart),
    address: bookingRow.serviceAddress || null,
    vehicle: ctx.vehicle
      ? {
          id: ctx.vehicle.id,
          type: ctx.vehicleType ? ctx.vehicleType.code : 'CAR',
          plate: ctx.vehicle.licensePlate,
          brand: ctx.vehicle.brand,
          model: ctx.vehicle.model
        }
      : null,
    services,
    mainService: services[0] ? services[0].code : null,
    extras: services.slice(1).map(s => s.code),
    price,
    operator: operatorUser ? operatorUser.nombre : null,
    paid: !!(paymentStatus && paymentStatus.code === 'APPROVED'),
    paymentStatus: paymentStatus ? paymentStatus.code : null,
    progress,
    // Calificación del cliente (se guarda en service_execution.quality_rating según el SQL).
    rating: firstExecution && firstExecution.qualityRating != null ? firstExecution.qualityRating : null,
    canRate: statusCode === 'COMPLETED' && !!firstExecution && firstExecution.qualityRating == null,
    notes: bookingRow.notes,
    customerId: ctx.customer ? ctx.customer.id : null,
    customerName: ctx.customerUser ? ctx.customerUser.nombre : null
  };
}

function latestPaymentForBooking(db, bookingId) {
  return db
    .get('payments')
    .filter({ bookingId })
    .value()
    .reduce((latest, p) => (!latest || p.id > latest.id ? p : latest), null);
}

function computeBookingsForCustomer(db, customerId) {
  const vehicleIds = db
    .get('vehicles')
    .filter({ customerId })
    .value()
    .map(v => v.id);

  return db
    .get('bookings')
    .value()
    .filter(b => vehicleIds.includes(b.vehicleId))
    .map(b => computeBooking(db, b))
    .filter(Boolean)
    .sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart));
}

function computePayment(db, paymentRow) {
  const booking = db.get('bookings').find({ id: paymentRow.bookingId }).value();
  const bookingComputed = booking ? computeBooking(db, booking) : null;
  const account = db.get('paymentAccounts').find({ id: paymentRow.paymentAccountId }).value();
  const methodType = account
    ? db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value()
    : null;
  const status = db.get('paymentStatuses').find({ id: paymentRow.paymentStatusId }).value();
  const receipt = db.get('paymentReceipts').find({ paymentId: paymentRow.id }).value();

  return {
    id: paymentRow.id,
    bookingId: paymentRow.bookingId,
    bookingCode: bookingComputed ? bookingComputed.code : null,
    service: bookingComputed ? bookingComputed.mainService : null,
    vehicle: bookingComputed ? bookingComputed.vehicle : null,
    date: formatDateEs(paymentRow.processedAt || paymentRow.createdAt || bookingRowFallbackDate(booking)),
    method: methodType ? methodType.name : null,
    amount: paymentRow.amount,
    status: status ? status.code : null,
    rejectionReason: paymentRow.rejectionReason || null,
    receiptUrl: receipt ? receipt.fileUrl : null,
    reference: receipt ? receipt.transactionReference : null
  };
}

function bookingRowFallbackDate(booking) {
  return booking ? booking.scheduledStart : new Date().toISOString();
}

function computePaymentsForCustomer(db, customerId) {
  const vehicleIds = db
    .get('vehicles')
    .filter({ customerId })
    .value()
    .map(v => v.id);
  const bookingIds = db
    .get('bookings')
    .value()
    .filter(b => vehicleIds.includes(b.vehicleId))
    .map(b => b.id);

  return db
    .get('payments')
    .value()
    .filter(p => bookingIds.includes(p.bookingId))
    .map(p => computePayment(db, p))
    // date ya viene formateado ("21 Sep 2026"), no sirve para ordenar: el id más alto es el más reciente.
    .sort((a, b) => b.id - a.id);
}

function computeNotification(db, row) {
  return {
    id: row.id,
    icon: row.icon,
    type: row.type,
    title: row.title,
    desc: row.desc,
    // ISO (yyyy-mm-dd): el centro de notificaciones filtra comparando contra <input type="date">.
    date: row.sentAt.slice(0, 10),
    time: formatTime(row.sentAt),
    read: row.isRead,
    referenceEntity: row.referenceEntity || null,
    referenceId: row.referenceId || null
  };
}

function computeNotificationsForUser(db, userId) {
  return db
    .get('notifications')
    .filter({ userId })
    .value()
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .map(row => computeNotification(db, row));
}

function computeDashboard(db, user) {
  const customer = getCustomerByUserId(db, user.id);
  if (!customer) return null;

  const vehicles = computeVehiclesForCustomer(db, customer.id);
  const bookings = computeBookingsForCustomer(db, customer.id);

  const activeStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];
  const activeBookings = bookings.filter(b => activeStatuses.includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  const now = localNow();
  const nextService =
    activeBookings
      .slice()
      .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
      .find(b => new Date(b.scheduledEnd) >= now) || null;

  const benefits = db
    .get('promotions')
    .filter({ isActive: true, isPublic: true })
    .value()
    .slice(0, 2)
    .map(p => ({ title: p.name, description: p.description }));

  const washesTowardGoal = completedBookings.length % 5;

  return {
    stats: {
      activeReservations: activeBookings.length,
      vehicles: vehicles.length,
      washesDone: completedBookings.length
    },
    nextService,
    vehicles: vehicles.slice(0, 3),
    benefits,
    loyalty: {
      current: washesTowardGoal,
      goal: 5,
      percentage: Math.round((washesTowardGoal / 5) * 100)
    },
    serviceHistory: bookings.slice(0, 3)
  };
}

// ---------------------------------------------------------------------------
// Reservar lavado: catálogo con precio por tipo de vehículo + disponibilidad de horarios.
// ---------------------------------------------------------------------------

function activeServicePrice(db, serviceId, vehicleTypeId, onDate = new Date().toISOString().slice(0, 10)) {
  return db
    .get('servicePrices')
    .filter({ serviceId, vehicleTypeId })
    .value()
    .find(sp => sp.validFrom <= onDate && (!sp.validTo || sp.validTo >= onDate));
}

// Servicio más reservado históricamente → badge "Más popular" en el formulario.
function mostPopularServiceCode(db) {
  const counts = {};

  for (const bs of db.get('bookingServices').value()) {
    const info = getServiceInfo(db, bs.servicePriceId);
    if (info.service) counts[info.service.code] = (counts[info.service.code] || 0) + 1;
  }

  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
}

function computeBookingOptions(db, vehicleRow) {
  const services = db
    .get('services')
    .filter({ isActive: true })
    .value()
    .map(service => {
      const sp = activeServicePrice(db, service.id, vehicleRow.vehicleTypeId);
      if (!sp) return null;

      return {
        servicePriceId: sp.id,
        code: service.code,
        name: service.name,
        description: service.description,
        price: sp.price,
        estimatedMinutes: sp.estimatedMinutes
      };
    })
    .filter(Boolean);

  return { vehicleId: vehicleRow.id, mostPopular: mostPopularServiceCode(db), services };
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(total) {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Horario de atención de un día concreto: excepción (festivo/horario especial) o el horario semanal.
function businessHoursFor(db, dateStr) {
  const exception = db.get('businessHourExceptions').find({ exceptionDate: dateStr }).value();
  if (exception) {
    return exception.isClosed
      ? { open: false, reason: exception.reason }
      : { open: true, opensAt: exception.opensAt, closesAt: exception.closesAt, reason: exception.reason };
  }

  const jsDay = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay(); // 0=Dom
  const sqlDayOfWeek = jsDay === 0 ? 7 : jsDay; // SQL: 1=Lun..7=Dom
  const row = db.get('businessHours').find({ dayOfWeek: sqlDayOfWeek }).value();

  if (!row || !row.isActive) return { open: false, reason: null };
  return { open: true, opensAt: row.opensAt, closesAt: row.closesAt, reason: null };
}

// Franjas de inicio (cada hora) donde el servicio cabe antes del cierre y queda al menos una
// bahía activa libre. Las fechas del mock se guardan como hora local con sufijo Z (ver bookings).
function computeAvailability(db, dateStr, durationMinutes, now = new Date()) {
  const hours = businessHoursFor(db, dateStr);
  if (!hours.open) return { date: dateStr, open: false, reason: hours.reason, slots: [] };

  const activeBays = db.get('serviceBays').filter({ isActive: true }).value().length;
  const blockingStatuses = db
    .get('bookingStatuses')
    .value()
    .filter(s => !['CANCELLED', 'NO_SHOW'].includes(s.code))
    .map(s => s.id);
  const dayBookings = db
    .get('bookings')
    .value()
    .filter(b => b.scheduledStart.slice(0, 10) === dateStr && blockingStatuses.includes(b.bookingStatusId));

  const opens = timeToMinutes(hours.opensAt);
  const closes = timeToMinutes(hours.closesAt);
  // Fecha local (no UTC): en Bogotá después de las 7 p.m. el día UTC ya es el siguiente.
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = [];

  for (let start = opens; start + durationMinutes <= closes; start += 60) {
    const end = start + durationMinutes;
    const overlapping = dayBookings.filter(b => {
      const bStart = timeToMinutes(formatTime(b.scheduledStart));
      const bEnd = timeToMinutes(formatTime(b.scheduledEnd));
      return bStart < end && start < bEnd;
    }).length;
    const isPast = dateStr < todayStr || (dateStr === todayStr && start <= nowMinutes);

    slots.push({
      time: minutesToTime(start),
      available: !isPast && overlapping < activeBays,
      freeBays: Math.max(0, activeBays - overlapping)
    });
  }

  return { date: dateStr, open: true, reason: hours.reason, opensAt: hours.opensAt, closesAt: hours.closesAt, slots };
}

// ---------------------------------------------------------------------------
// Pagar servicio: reservas pendientes de pago, métodos disponibles y total pagado.
// ---------------------------------------------------------------------------

function computePaymentMethods(db) {
  return db
    .get('paymentAccounts')
    .filter({ isActive: true })
    .value()
    .map(account => {
      const type = db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value();
      if (!type || !type.isActive) return null;

      return {
        paymentAccountId: account.id,
        code: type.code,
        name: type.name,
        accountHolder: account.accountHolder,
        accountNumber: account.accountNumber,
        instructions: account.instructions,
        requiresReceipt: type.requiresReceipt
      };
    })
    .filter(Boolean);
}

function computePaymentOverview(db, customerId) {
  const bookings = computeBookingsForCustomer(db, customerId);
  const payments = computePaymentsForCustomer(db, customerId);

  // Se puede pagar lo que no está cancelado y no tiene un pago aprobado ni uno en revisión.
  const payableBookings = bookings
    .filter(b => !['CANCELLED', 'NO_SHOW'].includes(b.status))
    .filter(b => b.paymentStatus !== 'APPROVED' && b.paymentStatus !== 'PENDING')
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  const totalPaid = payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.amount, 0);

  return {
    totalPaid,
    payableBookings,
    methods: computePaymentMethods(db),
    history: payments
  };
}

// ---------------------------------------------------------------------------
// Módulo operario: sus servicios asignados (agrupados por reserva), historial y calificaciones.
// ---------------------------------------------------------------------------

function getOperatorByUserId(db, userId) {
  return db.get('operators').find({ userId }).value();
}

// Estado de lo que le toca al operario en una reserva, a partir de sus service_execution.
function operatorWorkStatus(db, executions, bookingStatusCode) {
  const codes = executions.map(e => {
    const status = db.get('executionStatuses').find({ id: e.executionStatusId }).value();
    return status ? status.code : 'PENDING';
  });

  if (bookingStatusCode === 'CANCELLED' || bookingStatusCode === 'NO_SHOW' || codes.every(c => c === 'CANCELLED')) {
    return 'cancelado';
  }
  if (codes.every(c => c === 'COMPLETED' || c === 'CANCELLED')) return 'finalizado';
  if (codes.some(c => c === 'IN_PROGRESS' || c === 'COMPLETED')) return 'en_progreso';
  return 'pendiente';
}

// Un ítem por reserva (aunque tenga varios servicios): es la unidad que el operario inicia y finaliza.
// La forma cubre a la vez Reservation (inicio/agenda) y ServiceHistoryItem (historial) del frontend.
function computeOperatorServices(db, operatorId) {
  const byBooking = new Map();

  for (const execution of db.get('serviceExecutions').filter({ operatorId }).value()) {
    const bookingService = db.get('bookingServices').find({ id: execution.bookingServiceId }).value();
    if (!bookingService) continue;

    if (!byBooking.has(bookingService.bookingId)) byBooking.set(bookingService.bookingId, []);
    byBooking.get(bookingService.bookingId).push({ execution, bookingService });
  }

  const items = [];

  for (const [bookingId, entries] of byBooking) {
    const ctx = getBookingContext(db, bookingId);
    if (!ctx) continue;

    const { booking } = ctx;
    const lines = entries.map(e => getServiceInfo(db, e.bookingService.servicePriceId));
    const executions = entries.map(e => e.execution);
    const rated = executions.find(e => e.qualityRating != null);
    const payment = latestPaymentForBooking(db, bookingId);
    const account = payment ? db.get('paymentAccounts').find({ id: payment.paymentAccountId }).value() : null;
    const methodType = account ? db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value() : null;
    const cancellation = booking.cancellationReasonId
      ? db.get('cancellationReasons').find({ id: booking.cancellationReasonId }).value()
      : null;
    const vehicleName = ctx.vehicle ? [ctx.vehicle.brand, ctx.vehicle.model].filter(Boolean).join(' ') : '';

    items.push({
      id: bookingId,
      code: booking.code,
      date: booking.scheduledStart.slice(0, 10),
      time: formatTime(booking.scheduledStart),
      endTime: formatTime(booking.scheduledEnd),
      service: lines[0] && lines[0].service ? lines[0].service.code : null,
      serviceName: lines.map(l => l.name).join(' + '),
      client: ctx.customerUser ? ctx.customerUser.nombre : '',
      clientPhone: ctx.customerUser ? ctx.customerUser.telefono : null,
      vehicle: ctx.vehicleType ? ctx.vehicleType.code : 'CAR',
      vehicleName,
      plate: ctx.vehicle ? ctx.vehicle.licensePlate : '',
      address: booking.serviceAddress || '',
      bay: ctx.bay ? ctx.bay.name : null,
      durationMin: Math.round(hoursBetweenDates(booking.scheduledStart, booking.scheduledEnd) * 60),
      status: operatorWorkStatus(db, executions, ctx.status ? ctx.status.code : null),
      paymentMethod: methodType ? methodType.code : null,
      paymentMethodName: methodType ? methodType.name : null,
      amount: lines.reduce((sum, l) => sum + l.price, 0),
      rating: rated ? rated.qualityRating : null,
      comment: rated && rated.isCommentVisible ? rated.qualityComment : null,
      ratedAt: rated ? rated.ratedAt : null,
      reason: cancellation ? [cancellation.name, booking.notes].filter(Boolean).join(' — ') : null,
      notes: booking.notes
    });
  }

  return items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function averageOf(values) {
  if (!values.length) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function computeOperatorAssigned(db, operatorId) {
  const items = computeOperatorServices(db, operatorId).filter(s => s.status !== 'cancelado');
  const todayStr = localNow().toISOString().slice(0, 10);

  return {
    stats: {
      total: items.length,
      pending: items.filter(s => s.status === 'pendiente').length,
      inProgress: items.filter(s => s.status === 'en_progreso').length,
      completedToday: items.filter(s => s.status === 'finalizado' && s.date === todayStr).length
    },
    items
  };
}

function computeOperatorDashboard(db, user, operatorRow) {
  const todayStr = localNow().toISOString().slice(0, 10);
  const all = computeOperatorServices(db, operatorRow.id);
  const today = all.filter(s => s.date === todayStr && s.status !== 'cancelado');
  const completed = today.filter(s => s.status === 'finalizado').length;
  const ratings = all.filter(s => s.rating != null).map(s => s.rating);

  return {
    name: user.nombre.split(' ')[0],
    today: {
      total: today.length,
      pending: today.filter(s => s.status === 'pendiente').length,
      inProgress: today.filter(s => s.status === 'en_progreso').length,
      completed,
      progressPercentage: today.length ? Math.round((completed / today.length) * 100) : 0
    },
    unreadNotifications: db.get('notifications').filter({ userId: user.id, isRead: false }).value().length,
    averageRating: averageOf(ratings),
    todayServices: today
  };
}

// Historial = servicios ya cerrados (finalizados o cancelados), más recientes primero.
function computeOperatorHistory(db, operatorId) {
  const items = computeOperatorServices(db, operatorId)
    .filter(s => s.status === 'finalizado' || s.status === 'cancelado')
    .reverse();
  const completed = items.filter(s => s.status === 'finalizado');

  return {
    stats: {
      completed: completed.length,
      canceledOrReassigned: items.length - completed.length,
      totalGenerated: completed.reduce((sum, s) => sum + s.amount, 0),
      averageRating: averageOf(items.filter(s => s.rating != null).map(s => s.rating)),
      completionRate: items.length ? Math.round((completed.length / items.length) * 100) : 0
    },
    items
  };
}

// Nivel de satisfacción = % de calificaciones de 4 o 5 estrellas (últimos 12 meses).
function satisfactionLevelKey(percentage, total) {
  if (total === 0) return 'QUALIFICATION_STATS.LEVEL.NONE';
  if (percentage >= 85) return 'QUALIFICATION_STATS.LEVEL.VERY_HIGH';
  if (percentage >= 70) return 'QUALIFICATION_STATS.LEVEL.HIGH';
  if (percentage >= 50) return 'QUALIFICATION_STATS.LEVEL.MEDIUM';
  return 'QUALIFICATION_STATS.LEVEL.LOW';
}

function computeOperatorRatings(db, operatorId) {
  const since = localNow();
  since.setFullYear(since.getFullYear() - 1);
  const sinceStr = since.toISOString();

  const items = computeOperatorServices(db, operatorId)
    .filter(s => s.rating != null && (s.ratedAt || '') >= sinceStr)
    .sort((a, b) => (b.ratedAt || '').localeCompare(a.ratedAt || ''))
    .map(s => ({
      id: s.id,
      // solo nombre + inicial del apellido, como en la maqueta original
      client: s.client.split(' ').slice(0, 2).map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' '),
      service: s.service,
      date: s.ratedAt ? formatDateShort(s.ratedAt) : s.date,
      rating: s.rating,
      comment: s.comment,
      durationMin: s.durationMin,
      location: s.address,
      serviceId: s.code
    }));

  const satisfied = items.filter(r => r.rating >= 4).length;
  const satisfactionPercentage = items.length ? Math.round((satisfied / items.length) * 100) : 0;

  return {
    stats: {
      averageRating: averageOf(items.map(r => r.rating)),
      totalRatings: items.length,
      satisfactionPercentage,
      satisfactionLevel: satisfactionLevelKey(satisfactionPercentage, items.length)
    },
    items
  };
}

// ---------------------------------------------------------------------------
// Admin > Reservas: listado del día, disponibilidad de operarios para asignar.
// ---------------------------------------------------------------------------

const ADMIN_BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'cancelled'
};

function operatorSummary(db, operatorRow) {
  const user = getUser(db, operatorRow.userId);
  return {
    id: `OP-${operatorRow.id}`,
    initials: user ? user.iniciales : '',
    name: user ? user.nombre : 'Operario'
  };
}

// Operario asignado = el de la primera ejecución de la reserva (una reserva la atiende un operario).
function assignedOperatorRow(db, bookingId) {
  const bsIds = db.get('bookingServices').filter({ bookingId }).value().map(bs => bs.id);
  const execution = db.get('serviceExecutions').value().find(e => bsIds.includes(e.bookingServiceId));
  return execution ? db.get('operators').find({ id: execution.operatorId }).value() : null;
}

// Texto relativo como clave i18n + parámetros (el frontend lo traduce).
function relativeTimeFor(booking, statusCode, now) {
  const start = new Date(booking.scheduledStart);
  const end = new Date(booking.scheduledEnd);
  const minutes = ms => Math.max(0, Math.round(ms / 60000));

  if (statusCode === 'COMPLETED') return { key: 'ADMIN_RESERVATIONS.RELATIVE.COMPLETED', params: {} };
  if (statusCode === 'CANCELLED' || statusCode === 'NO_SHOW') return { key: 'ADMIN_RESERVATIONS.RELATIVE.CANCELLED', params: {} };
  if (statusCode === 'IN_PROGRESS') {
    return now < end
      ? { key: 'ADMIN_RESERVATIONS.RELATIVE.ENDS_IN', params: { min: minutes(end - now) } }
      : { key: 'ADMIN_RESERVATIONS.RELATIVE.OVERDUE', params: {} };
  }
  if (start > now) {
    const diff = minutes(start - now);
    if (diff < 60) return { key: 'ADMIN_RESERVATIONS.RELATIVE.IN_MINUTES', params: { min: diff } };
    if (diff < 24 * 60) return { key: 'ADMIN_RESERVATIONS.RELATIVE.IN_HOURS', params: { hours: Math.round(diff / 6) / 10 } };
    return { key: 'ADMIN_RESERVATIONS.RELATIVE.IN_DAYS', params: { days: Math.round(diff / 1440) } };
  }
  return { key: 'ADMIN_RESERVATIONS.RELATIVE.LATE', params: {} };
}

function computeAdminBooking(db, bookingRow, now = localNow()) {
  const ctx = getBookingContext(db, bookingRow.id);
  const statusCode = ctx.status ? ctx.status.code : 'PENDING';
  const lines = db
    .get('bookingServices')
    .filter({ bookingId: bookingRow.id })
    .value()
    .map(bs => getServiceInfo(db, bs.servicePriceId));
  const operatorRow = assignedOperatorRow(db, bookingRow.id);

  return {
    id: bookingRow.id,
    code: bookingRow.code,
    client: ctx.customerUser ? ctx.customerUser.nombre : '',
    phone: ctx.customerUser ? ctx.customerUser.telefono : null,
    vehicle: ctx.vehicle ? [ctx.vehicle.brand, ctx.vehicle.model].filter(Boolean).join(' ') : '',
    vehicleType: ctx.vehicleType ? ctx.vehicleType.code : null,
    plate: ctx.vehicle ? ctx.vehicle.licensePlate : '',
    service: lines.map(l => l.name).join(' + '),
    address: bookingRow.serviceAddress,
    isoDate: bookingRow.scheduledStart.slice(0, 10),
    date: formatDateShort(bookingRow.scheduledStart),
    timeRange: `${formatTime(bookingRow.scheduledStart)} - ${formatTime(bookingRow.scheduledEnd)}`,
    relative: relativeTimeFor(bookingRow, statusCode, now),
    bay: ctx.bay ? ctx.bay.name : '—',
    status: ADMIN_BOOKING_STATUS[statusCode] || 'pending',
    operator: operatorRow ? operatorSummary(db, operatorRow) : null,
    amount: lines.reduce((sum, l) => sum + l.price, 0) - (bookingRow.pointsDiscountAmount || 0)
  };
}

function computeAdminBookings(db, dateStr) {
  const items = db
    .get('bookings')
    .value()
    .filter(b => !dateStr || b.scheduledStart.slice(0, 10) === dateStr)
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
    .map(b => computeAdminBooking(db, b));

  const operatorNames = db
    .get('operators')
    .value()
    .map(o => operatorSummary(db, o).name);

  return {
    stats: {
      total: items.length,
      confirmedInProgress: items.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
      unassigned: items.filter(b => !b.operator && !['cancelled', 'completed'].includes(b.status)).length,
      cancelled: items.filter(b => b.status === 'cancelled').length
    },
    operatorNames,
    items
  };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Para el modal "Asignar operario": quién puede tomar esta reserva según su horario semanal,
// incapacidades/ausencias y otros servicios que se crucen.
function computeOperatorOptions(db, bookingRow) {
  const start = bookingRow.scheduledStart;
  const end = bookingRow.scheduledEnd;
  const dateStr = start.slice(0, 10);
  const jsDay = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();
  const sqlDay = jsDay === 0 ? 7 : jsDay;
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  const cancelledStatusIds = db
    .get('bookingStatuses')
    .value()
    .filter(s => ['CANCELLED', 'NO_SHOW'].includes(s.code))
    .map(s => s.id);

  return db
    .get('operators')
    .value()
    .filter(o => o.isActive !== false)
    .map(o => {
      const base = operatorSummary(db, o);
      const option = { ...base, specialty: o.specialty || '', rating: o.rating ?? 0, availability: 'available' };

      const absence = db
        .get('operatorAbsence')
        .filter({ operatorId: o.id })
        .value()
        .find(a => overlaps(start, end, a.startsAt, a.endsAt));
      if (absence) return { ...option, availability: 'unavailable', availabilityNote: absence.reason };

      const shift = db.get('operatorAvailability').find({ operatorId: o.id, dayOfWeek: sqlDay, isActive: true }).value();
      if (!shift || startTime < shift.startsAt || endTime > shift.endsAt) {
        return { ...option, availability: 'unavailable', availabilityNote: 'Fuera de su horario laboral' };
      }

      const clash = enrichExecutions(db, o.id).find(
        e =>
          e.ctx.booking.id !== bookingRow.id &&
          !cancelledStatusIds.includes(e.ctx.booking.bookingStatusId) &&
          overlaps(start, end, e.ctx.booking.scheduledStart, e.ctx.booking.scheduledEnd)
      );
      if (clash) {
        const bay = clash.ctx.bay ? ` (${clash.ctx.bay.name})` : '';
        return {
          ...option,
          availability: 'busy',
          availabilityNote: `Ocupado ${formatTime(clash.ctx.booking.scheduledStart)} - ${formatTime(clash.ctx.booking.scheduledEnd)}${bay}`
        };
      }

      return option;
    })
    .sort((a, b) => ['available', 'busy', 'unavailable'].indexOf(a.availability) - ['available', 'busy', 'unavailable'].indexOf(b.availability));
}

// ---------------------------------------------------------------------------
// Admin > Pagos: bandeja de verificación de comprobantes.
// ---------------------------------------------------------------------------

function computeAdminPayment(db, paymentRow) {
  const booking = db.get('bookings').find({ id: paymentRow.bookingId }).value();
  const ctx = booking ? getBookingContext(db, booking.id) : null;
  const account = db.get('paymentAccounts').find({ id: paymentRow.paymentAccountId }).value();
  const methodType = account ? db.get('paymentMethodTypes').find({ id: account.paymentMethodTypeId }).value() : null;
  const status = db.get('paymentStatuses').find({ id: paymentRow.paymentStatusId }).value();
  const receipt = db.get('paymentReceipts').find({ paymentId: paymentRow.id }).value();
  const operatorRow = booking ? assignedOperatorRow(db, booking.id) : null;
  const operatorUser = operatorRow ? getUser(db, operatorRow.userId) : null;
  const lines = booking
    ? db.get('bookingServices').filter({ bookingId: booking.id }).value().map(bs => getServiceInfo(db, bs.servicePriceId))
    : [];
  const reportedAt = (receipt && receipt.uploadedAt) || paymentRow.createdAt || paymentRow.processedAt || (booking && booking.scheduledStart);
  const minutes = booking ? Math.round(hoursBetweenDates(booking.scheduledStart, booking.scheduledEnd) * 60) : 0;

  return {
    id: paymentRow.id,
    code: `#PAG-${String(paymentRow.id).padStart(4, '0')}`,
    status: status ? status.code.toLowerCase() : 'pending',
    client: ctx && ctx.customerUser ? ctx.customerUser.nombre : '',
    phone: ctx && ctx.customerUser ? ctx.customerUser.telefono || '—' : '—',
    email: ctx && ctx.customerUser ? ctx.customerUser.correo : '—',
    bookingCode: booking ? booking.code : '—',
    service: lines.map(l => l.name).join(' + ') || '—',
    vehicle: ctx && ctx.vehicle ? [ctx.vehicle.brand, ctx.vehicle.model].filter(Boolean).join(' ') : '—',
    plate: ctx && ctx.vehicle ? ctx.vehicle.licensePlate : '—',
    scheduleLabel: booking
      ? `${formatDateShort(booking.scheduledStart)}, ${formatTime(booking.scheduledStart)} - ${formatTime(booking.scheduledEnd)} (${minutes} min)`
      : '—',
    bay: ctx && ctx.bay ? ctx.bay.name : '—',
    operator: operatorUser ? operatorUser.nombre : '—',
    method: methodType ? methodType.code.toLowerCase() : 'cash',
    methodName: methodType ? methodType.name : '—',
    reference: receipt && receipt.transactionReference ? receipt.transactionReference : '—',
    amount: paymentRow.amount,
    amountDeclared: receipt ? receipt.reportedAmount : paymentRow.amount,
    bankAccount: account && account.accountNumber ? account.accountNumber : '—',
    accountHolder: account ? account.accountHolder : null,
    isoDate: reportedAt ? reportedAt.slice(0, 10) : '',
    date: reportedAt ? formatDateShort(reportedAt) : '—',
    time: reportedAt ? formatTime(reportedAt) : '',
    rejectionReason: paymentRow.rejectionReason || null
  };
}

function computeAdminPayments(db) {
  const items = db
    .get('payments')
    .value()
    .slice()
    .sort((a, b) => b.id - a.id)
    .map(p => computeAdminPayment(db, p));
  const todayStr = localNow().toISOString().slice(0, 10);
  const approved = items.filter(p => p.status === 'approved');
  const approvedToday = db
    .get('payments')
    .value()
    .filter(p => p.processedAt && p.processedAt.slice(0, 10) === todayStr)
    .map(p => items.find(i => i.id === p.id))
    .filter(p => p && p.status === 'approved');

  return {
    stats: {
      pending: items.filter(p => p.status === 'pending').length,
      approvedToday: approvedToday.length,
      approvedAmount: approvedToday.reduce((sum, p) => sum + p.amount, 0),
      rejected: items.filter(p => p.status === 'rejected').length,
      totalCollected: approved.reduce((sum, p) => sum + p.amount, 0),
      transactionsCount: items.length
    },
    items
  };
}

// Reservas de cualquier cliente sin pago aprobado ni en revisión (para el registro manual).
function computeAdminPayableBookings(db) {
  const cancelledIds = db.get('bookingStatuses').value().filter(s => ['CANCELLED', 'NO_SHOW'].includes(s.code)).map(s => s.id);

  return db
    .get('bookings')
    .value()
    .filter(b => !cancelledIds.includes(b.bookingStatusId))
    .filter(b => {
      const last = latestPaymentForBooking(db, b.id);
      const status = last ? db.get('paymentStatuses').find({ id: last.paymentStatusId }).value() : null;
      return !status || status.code === 'REJECTED';
    })
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
    .map(b => {
      const computed = computeBooking(db, b);
      return {
        bookingId: b.id,
        code: b.code,
        client: computed.customerName,
        service: computed.services.map(s => s.name).join(' + '),
        date: computed.date,
        amount: computed.price
      };
    });
}

// ---------------------------------------------------------------------------
// Admin > Dashboard: todo el resumen del día en una sola llamada.
// ---------------------------------------------------------------------------

const WEEKDAY_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_LONG_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// $520k / $1.1M, como la maqueta original
function shortCop(amount) {
  if (amount >= 1000000) return `$${Math.round(amount / 100000) / 10}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}k`;
  return `$${amount}`;
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function computeAdminDashboard(db, user) {
  const now = localNow();
  const todayStr = isoDay(now);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = isoDay(yesterday);

  const statusCode = id => (db.get('bookingStatuses').find({ id }).value() || {}).code;
  const bookings = db.get('bookings').value();
  const active = b => !['CANCELLED', 'NO_SHOW'].includes(statusCode(b.bookingStatusId));
  const bookingsToday = bookings.filter(b => b.scheduledStart.slice(0, 10) === todayStr && active(b)).length;
  const bookingsYesterday = bookings.filter(b => b.scheduledStart.slice(0, 10) === yesterdayStr && active(b)).length;

  // ingresos = pagos aprobados, por el día en que se aprobaron
  const approvedId = (db.get('paymentStatuses').find({ code: 'APPROVED' }).value() || {}).id;
  const approved = db.get('payments').value().filter(p => p.paymentStatusId === approvedId && p.processedAt);
  const revenueOn = dayStr => approved.filter(p => p.processedAt.slice(0, 10) === dayStr).reduce((s, p) => s + p.amount, 0);

  // semana lunes-domingo que contiene hoy
  const dow = (now.getUTCDay() + 6) % 7; // 0 = lunes
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - dow);
  const weeklyRevenue = WEEKDAY_SHORT_ES.map((day, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const amount = revenueOn(isoDay(d));
    return { day, amount, label: shortCop(amount), isToday: i === dow };
  });
  const peak = weeklyRevenue.reduce((best, d, i) => (d.amount > weeklyRevenue[best].amount ? i : best), 0);

  const operators = computeOperators(db).map(o => ({
    initials: o.initials,
    name: o.name,
    role: o.specialty,
    status: o.status === 'in_service' ? 'busy' : o.status === 'medical_leave' ? 'leave' : 'available',
    bay: o.bay || ''
  }));

  const payments = computeAdminPayments(db);
  const pendingPayments = payments.items
    .filter(p => p.status === 'pending')
    .slice(0, 3)
    .map(p => ({ id: p.id, client: p.client, bank: p.methodName, bankClass: p.method, service: p.service, reference: p.reference, amount: p.amount }));

  // reservas de hoy en adelante, sin operario, que aún se pueden atender
  const unassigned = bookings
    .filter(b => b.scheduledStart.slice(0, 10) >= todayStr && ['PENDING', 'CONFIRMED'].includes(statusCode(b.bookingStatusId)))
    .filter(b => !assignedOperatorRow(db, b.id))
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))
    .map(b => computeAdminBooking(db, b, now));

  return {
    adminName: user.nombre.split(' ')[0],
    stats: {
      bookingsToday,
      vsYesterday: bookingsToday - bookingsYesterday,
      servicesInProgress: bookings.filter(b => statusCode(b.bookingStatusId) === 'IN_PROGRESS').length,
      activeBays: db.get('serviceBays').filter({ isActive: true }).value().length,
      pendingPayments: payments.stats.pending,
      revenueToday: revenueOn(todayStr)
    },
    weeklyRevenue,
    weekTotal: weeklyRevenue.reduce((s, d) => s + d.amount, 0),
    peakDay: weeklyRevenue[peak].amount > 0 ? WEEKDAY_LONG_ES[peak] : null,
    operators,
    pendingPayments,
    unassignedCount: unassigned.length,
    unassignedBookings: unassigned.slice(0, 3).map((b, i) => ({
      id: b.id,
      time: b.timeRange.split(' - ')[0],
      date: b.date,
      bay: b.bay,
      client: b.client,
      vehicle: b.vehicle,
      service: b.service,
      isUpcoming: i === 0 && b.isoDate === todayStr
    }))
  };
}

// ---------------------------------------------------------------------------
// Admin > Horarios: horario semanal, excepciones y bahías.
// ---------------------------------------------------------------------------

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']; // SQL dayOfWeek 1..7

function bayStatus(bay) {
  return bay.status || (bay.isActive ? 'active' : 'inactive');
}

function computeAdminSchedule(db) {
  const now = localNow().toISOString();
  const inProgressId = (db.get('bookingStatuses').find({ code: 'IN_PROGRESS' }).value() || {}).id;

  const weeklySchedule = DAY_KEYS.map((key, i) => {
    const row = db.get('businessHours').find({ dayOfWeek: i + 1 }).value();
    return {
      key,
      isWorking: !!(row && row.isActive),
      openTime: row && row.isActive ? row.opensAt : '08:00',
      closeTime: row && row.isActive ? row.closesAt : '18:00',
      pause: (row && row.pause) || 'none'
    };
  });

  const exceptions = db
    .get('businessHourExceptions')
    .value()
    .slice()
    .sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
    .map(e => ({
      id: String(e.id),
      date: e.exceptionDate,
      type: e.isClosed ? 'holiday' : 'special',
      closedAllDay: !!e.isClosed,
      openTime: e.opensAt || '',
      closeTime: e.closesAt || '',
      reason: e.reason || ''
    }));

  // operario trabajando ahora mismo en cada bahía (reserva en curso)
  const bays = db
    .get('serviceBays')
    .value()
    .map(bay => {
      const current = db
        .get('bookings')
        .value()
        .find(b => b.serviceBayId === bay.id && b.bookingStatusId === inProgressId && b.scheduledStart <= now);
      const operatorRow = current ? assignedOperatorRow(db, current.id) : null;
      const operatorUser = operatorRow ? getUser(db, operatorRow.userId) : null;
      return {
        id: String(bay.id),
        name: bay.name,
        status: bayStatus(bay),
        currentOperator: operatorUser ? operatorUser.nombre : null
      };
    });

  const history = (db.get('scheduleChangeLog').value() || [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(h => ({ date: formatDateShort(h.createdAt), author: h.author, description: h.description }));

  return { weeklySchedule, exceptions, bays, history };
}

// ---------------------------------------------------------------------------
// Admin > Reportes: servicios realizados (reservas completadas) e ingresos (pagos aprobados).
// ---------------------------------------------------------------------------

function computeAdminReports(db) {
  const now = localNow();
  const todayStr = isoDay(now);
  const monthPrefix = todayStr.slice(0, 7);
  const yearPrefix = todayStr.slice(0, 4);

  const completedId = (db.get('bookingStatuses').find({ code: 'COMPLETED' }).value() || {}).id;
  const approvedId = (db.get('paymentStatuses').find({ code: 'APPROVED' }).value() || {}).id;
  const completed = db.get('bookings').value().filter(b => b.bookingStatusId === completedId);
  const approved = db.get('payments').value().filter(p => p.paymentStatusId === approvedId && p.processedAt);

  const dow = (now.getUTCDay() + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() - dow);
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return isoDay(d);
  });

  const servicesWhere = match => completed.filter(b => match(b.scheduledStart.slice(0, 10))).length;
  const revenueWhere = match => approved.filter(p => match(p.processedAt.slice(0, 10))).reduce((s, p) => s + p.amount, 0);
  const inWeek = day => weekDays.includes(day);

  // ranking: cuántas veces se vendió cada servicio (reservas no canceladas)
  const cancelledIds = db.get('bookingStatuses').value().filter(s => ['CANCELLED', 'NO_SHOW'].includes(s.code)).map(s => s.id);
  const liveBookingIds = db.get('bookings').value().filter(b => !cancelledIds.includes(b.bookingStatusId)).map(b => b.id);
  const sales = {};
  for (const bs of db.get('bookingServices').value()) {
    if (!liveBookingIds.includes(bs.bookingId)) continue;
    const info = getServiceInfo(db, bs.servicePriceId);
    sales[info.name] = (sales[info.name] || 0) + (bs.quantity || 1);
  }
  const ranking = Object.entries(sales).sort((a, b) => b[1] - a[1]);
  const top = ranking.length ? ranking[0][1] : 0;

  return {
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    servicesPerDay: weekDays.map(day => servicesWhere(d => d === day)),
    revenuePerDay: weekDays.map(day => revenueWhere(d => d === day)),
    dayReport: { services: servicesWhere(d => d === todayStr), revenue: revenueWhere(d => d === todayStr) },
    weekReport: { services: servicesWhere(inWeek), revenue: revenueWhere(inWeek) },
    monthReport: { services: servicesWhere(d => d.startsWith(monthPrefix)), revenue: revenueWhere(d => d.startsWith(monthPrefix)) },
    yearRevenue: revenueWhere(d => d.startsWith(yearPrefix)),
    topServices: ranking.slice(0, 5).map(([name, count]) => ({
      name,
      sales: count,
      percentage: top ? Math.round((count / top) * 100) : 0
    }))
  };
}

module.exports = {
  computeAdminReports,
  DAY_KEYS,
  computeAdminSchedule,
  computeAdminDashboard,
  computeAdminPayment,
  computeAdminPayments,
  computeAdminPayableBookings,
  computePaymentMethods,
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
  computeBookingOptions,
  computeAvailability,
  computePaymentOverview,
  latestPaymentForBooking,
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
  computeDashboard
};
