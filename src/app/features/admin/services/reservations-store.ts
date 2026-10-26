import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, catchError, tap } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api';
import { UserAdminService } from '../../../core/services/user-admin';
import { AuthUser } from '../../../core/models/auth.models';
import {
  BookingResponse,
  BookingStatusCode,
  CreateBookingRequest,
  RescheduleBookingRequest,
} from '../../../core/models/booking.models';
import { apiErrorKey } from '../../../core/utils/api-error';
import { cancellationReasonKey } from '../../../core/utils/booking-display';
import { Booking, BookingStatus } from '../models/admin.models';
// quién tiene cada reserva (operations-service)
import { AssignmentResponse, OperationsApiService, UnassignedResponse, ToCloseResponse } from '../../../core/services/operations-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';


// ventana de reservas que se carga: 30 días atrás y 31 adelante (el backend acepta hasta 62)
const DAYS_BACK = 30;
const DAYS_AHEAD = 31;

/** fecha ISO (yyyy-MM-dd) en la hora local, con la cantidad de días indicada respecto a hoy */
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function minutesToTime(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** fecha legible d/m/aaaa */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** rango horario "15:00 - 16:00" a partir del inicio y la duración */
export function formatTimeRange(start: string, durationMin: number): string {
  return `${start} - ${minutesToTime(timeToMinutes(start) + durationMin)}`;
}

/** etiqueta de la reserva usada en pagos y en el modal de asignación */
export function scheduleLabel(date: string, time: string, durationMin: number): string {
  return `${formatDate(date)} · ${formatTimeRange(time, durationMin)}`;
}

// estado del backend (ADR-010) -> estado que usan las pantallas y sus estilos
const STATUS_BY_CODE: Record<BookingStatusCode, BookingStatus> = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export function statusCode(status: BookingStatus): BookingStatusCode {
  return status.toUpperCase() as BookingStatusCode;
}

/**
 * Fuente única de las reservas del administrador, con los datos del booking-service.
 *
 * El dashboard, la pantalla de reservas y los reportes leen de aquí. Cada reserva trae el
 * vehículo y el user_id del dueño; el nombre, teléfono y correo se completan con las cuentas
 * de security-service (solo para mostrarlos).
 */
@Injectable({ providedIn: 'root' })
export class ReservationsStore {

  private readonly api = inject(BookingApiService);
  private readonly userAdmin = inject(UserAdminService);
  private readonly operations = inject(OperationsApiService);
  private readonly feedback = inject(FeedbackService);

  private readonly state = signal<Booking[]>([]);
  private clients = new Map<number, AuthUser>();
  private assignments = new Map<string, AssignmentResponse>();
  // reservas que necesitan operario según operations-service (una sola regla para el inicio y reservas)
  private readonly unassignedIds = signal<ReadonlySet<string>>(new Set());
  // reservas con operario que terminaron y nadie registró: las cierra el admin (id -> motivo)
  private readonly toCloseReasons = signal<ReadonlyMap<string, ToCloseResponse['reason']>>(new Map());

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly bookings = computed(() =>
    [...this.state()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  );

  // hay una carga en curso: un refresco automático no pide lo mismo otra vez
  private inFlight = false;

  /**
   * Carga las reservas de la ventana y las cuentas de los clientes. Ya no se carga una sola vez al
   * crear el store: cada pantalla la pide al entrar y LiveRefresh la repite (WEB-16). Con `silent`
   * (refresco automático) no muestra el indicador de carga y, si falla, deja los datos que había.
   */
  load(silent = false): void {
    if (silent && this.inFlight) return;
    this.inFlight = true;
    if (!silent) {
      this.loading.set(true);
      this.loadError.set(null);
    }
    forkJoin({
      bookings: this.api.adminBookings(isoDate(-DAYS_BACK), isoDate(DAYS_AHEAD)),
      // si falla la lista de clientes, las reservas igual se muestran (sin nombre)
      clients: this.userAdmin.listAccounts(0, 100, 'CLIENT').pipe(
        map(page => page.items),
        catchError(() => of([] as AuthUser[]))
      ),
      // si operations no responde, las reservas igual se muestran (sin operario)
      assignments: this.operations.assignments(isoDate(-DAYS_BACK), isoDate(DAYS_AHEAD)).pipe(
        catchError(() => of([] as AssignmentResponse[]))
      ),
      unassigned: this.operations.unassigned(isoDate(), isoDate(DAYS_AHEAD)).pipe(
        catchError(() => of(null as UnassignedResponse | null))
      ),
      // si operations no responde, la tarjeta "Por cerrar" queda vacía y el resto funciona
      toClose: this.operations.toClose().pipe(catchError(() => of([] as ToCloseResponse[]))),
    }).subscribe({
      next: ({ bookings, clients, assignments, unassigned, toClose }) => {
        this.clients = new Map(clients.map(client => [client.id, client]));
        this.assignments = new Map(assignments.map(a => [String(a.bookingId), a]));
        this.state.set(bookings.map(b => this.toBooking(b)));
        this.unassignedIds.set(new Set(unassigned
          ? unassigned.bookingIds.map(String)
          // operations no respondió: misma regla calculada aquí para no dejar el conteo en cero
          : this.state().filter(b => this.needsOperatorLocally(b)).map(b => b.id)));
        this.toCloseReasons.set(new Map(toClose.map(item => [String(item.bookingId), item.reason])));
        this.loadError.set(null);
        this.loading.set(false);
        this.inFlight = false;
      },
      error: (error) => {
        this.inFlight = false;
        if (silent) return;
        this.loadError.set(apiErrorKey(error));
        this.loading.set(false);
      }
    });
  }

  /** reservas de un día concreto, en formato yyyy-MM-dd */
  byDate(date: string): Booking[] {
    return this.bookings().filter(b => b.date === date);
  }

  get today(): string {
    return isoDate();
  }

  getById(id: string): Booking | undefined {
    return this.state().find(b => b.id === id);
  }

  /** la reserva todavía necesita operario (regla de operations-service) */
  isUnassigned(booking: Booking): boolean {
    return this.unassignedIds().has(booking.id);
  }

  /** reservas que necesitan operario, de la más próxima a la más lejana */
  readonly unassigned = computed(() => this.bookings().filter(b => this.unassignedIds().has(b.id)));

  /** reservas con operario que terminaron y nadie registró, de la más antigua a la más reciente */
  readonly toClose = computed(() => this.bookings()
    .filter(b => this.toCloseReasons().has(b.id))
    .map(booking => ({ booking, reason: this.toCloseReasons().get(booking.id)! })));

  /* ---------- cambios (el backend valida y responde la reserva actualizada) ---------- */

  create(request: CreateBookingRequest): Observable<Booking> {
    return this.api.adminCreateBooking(request).pipe(
      map(response => this.toBooking(response)),
      tap(created => this.state.update(list => [...list, created]))
    );
  }

  reschedule(id: string, request: RescheduleBookingRequest): Observable<Booking> {
    return this.api.adminReschedule(Number(id), request).pipe(
      map(response => this.toBooking(response)),
      tap(updated => this.replace(updated))
    );
  }

  setStatus(id: string, status: BookingStatus, reasonCode?: string): Observable<Booking> {
    return this.api.adminChangeStatus(Number(id), statusCode(status), reasonCode).pipe(
      map(response => this.toBooking(response)),
      tap(updated => {
        this.replace(updated);
        // cancelada, iniciada o no asistió: ya no necesita operario
        if (updated.status !== 'confirmed' && updated.status !== 'scheduled') this.markAssigned(id);
        if (updated.status === 'no_show' || updated.status === 'completed') this.markClosed(id);
      })
    );
  }

  /** el admin confirma que la reserva sí se atendió aunque nadie la registró */
  closeAsAttended(id: string): Observable<void> {
    return this.operations.closeAsAttended(Number(id)).pipe(
      tap(() => {
        this.state.update(list => list.map(b => (b.id === id ? { ...b, status: 'completed' as const } : b)));
        this.markClosed(id);
      })
    );
  }

  /**
   * Asigna (o cambia) el operario en operations-service. El backend valida turno, ausencias y
   * cruces; si lo rechaza, se muestra el error aquí mismo.
   */
  // onAssigned solo corre si operations aceptó (turno, ausencias y cruces los valida el backend)
  assignOperator(id: string, operatorId: string | null, onAssigned?: () => void, notes = ''): void {
    if (!operatorId) return; // operations no tiene "quitar operario": se cambia por otro
    this.operations.assign(Number(id), Number(operatorId), notes).subscribe({
      next: assignment => {
        this.assignments.set(id, assignment);
        this.state.update(list => list.map(b => (b.id === id ? { ...b, operator: this.operatorRef(id) } : b)));
        this.markAssigned(id);
        onAssigned?.();
      },
      error: err => this.feedback.error('COMMON.ERROR', apiErrorKey(err))
    });
  }

  /* ---------- internos ---------- */

  private needsOperatorLocally(b: Booking): boolean {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const nowKey = `${isoDate()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endKey = `${b.date}T${minutesToTime(timeToMinutes(b.time) + b.durationMin)}`;
    return (b.status === 'confirmed' || b.status === 'scheduled') && !b.operator && endKey > nowKey;
  }

  private markClosed(id: string): void {
    this.toCloseReasons.update(reasons => new Map([...reasons].filter(([other]) => other !== id)));
  }

  private markAssigned(id: string): void {
    this.unassignedIds.update(ids => new Set([...ids].filter(other => other !== id)));
  }

  private replace(updated: Booking): void {
    this.state.update(list => list.map(b => (b.id === updated.id ? updated : b)));
  }

  private operatorRef(bookingId: string): Booking['operator'] {
    const assignment = this.assignments.get(bookingId);
    if (!assignment) return null;
    const name = assignment.operatorName || 'Operario';
    const initials = name.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
    return { id: String(assignment.operatorId), initials, name };
  }

  private toBooking(response: BookingResponse): Booking {
    const id = String(response.id);
    const owner = response.ownerUserId !== null ? this.clients.get(response.ownerUserId) : undefined;
    const vehicle = response.vehicle;
    return {
      id,
      code: response.code,
      clientUserId: response.ownerUserId,
      client: owner ? `${owner.firstName} ${owner.lastName}` : '—',
      phone: owner?.phone ?? '',
      email: owner?.email ?? '',
      vehicle: vehicle ? `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim() || vehicle.vehicleTypeName : '—',
      plate: vehicle?.licensePlateFormatted ?? '—',
      service: response.services.map(s => s.name).join(', '),
      serviceIds: response.services.map(s => s.serviceId),
      vehicleId: vehicle?.id ?? null,
      date: response.date,
      time: response.startTime,
      durationMin: response.durationMinutes,
      bay: response.bay?.name ?? null,
      status: STATUS_BY_CODE[response.status],
      changeable: response.changeable,
      cancellationReason: response.cancellationReason?.name ?? null,
      cancellationReasonKey: cancellationReasonKey(response.cancellationReason?.code),
      operator: this.operatorRef(id),
      notes: response.notes ?? '',
      createdAt: response.createdAt ?? '',
      amount: response.total,
    };
  }
}
