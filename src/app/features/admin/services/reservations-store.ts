import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, catchError, tap } from 'rxjs';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
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
import { Booking, BookingStatus } from '../models/admin.models';
import { OperatorsStore } from './operators-store';

/**
 * La asignación de operario todavía no tiene backend (operations-service no existe): se guarda
 * solo en este navegador. Cuando exista, esto se reemplaza por su API.
 */
const OPERATOR_KEY = 'adminBookingOperators';

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
  private readonly operators = inject(OperatorsStore);

  private readonly state = signal<Booking[]>([]);
  private clients = new Map<number, AuthUser>();
  private operatorByBooking: Record<string, string> = readStorage(OPERATOR_KEY, {});

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly bookings = computed(() =>
    [...this.state()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  );

  constructor() {
    this.load();
  }

  /** carga las reservas de la ventana y las cuentas de los clientes */
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      bookings: this.api.adminBookings(isoDate(-DAYS_BACK), isoDate(DAYS_AHEAD)),
      // si falla la lista de clientes, las reservas igual se muestran (sin nombre)
      clients: this.userAdmin.listAccounts(0, 100, 'CLIENT').pipe(
        map(page => page.items),
        catchError(() => of([] as AuthUser[]))
      ),
    }).subscribe({
      next: ({ bookings, clients }) => {
        this.clients = new Map(clients.map(client => [client.id, client]));
        this.state.set(bookings.map(b => this.toBooking(b)));
        this.loading.set(false);
      },
      error: (error) => {
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
      tap(updated => this.replace(updated))
    );
  }

  /** temporal: la asignación vive en este navegador hasta que exista operations-service */
  assignOperator(id: string, operatorId: string | null): void {
    if (operatorId) {
      this.operatorByBooking[id] = operatorId;
    } else {
      delete this.operatorByBooking[id];
    }
    writeStorage(OPERATOR_KEY, this.operatorByBooking);
    this.state.update(list => list.map(b => (b.id === id ? { ...b, operator: this.operatorRef(id) } : b)));
  }

  /* ---------- internos ---------- */

  private replace(updated: Booking): void {
    this.state.update(list => list.map(b => (b.id === updated.id ? updated : b)));
  }

  private operatorRef(bookingId: string): Booking['operator'] {
    const operatorId = this.operatorByBooking[bookingId];
    const operator = operatorId ? this.operators.getById(operatorId) : undefined;
    return operator ? { id: operator.id, initials: operator.initials, name: operator.name } : null;
  }

  private toBooking(response: BookingResponse): Booking {
    const id = String(response.id);
    const owner = response.ownerUserId !== null ? this.clients.get(response.ownerUserId) : undefined;
    const vehicle = response.vehicle;
    return {
      id,
      code: response.code,
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
      operator: this.operatorRef(id),
      notes: response.notes ?? '',
      createdAt: response.createdAt ?? '',
      amount: response.total,
    };
  }
}
