import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api';
import {
  BayResponse,
  BayStatusCode,
  BusinessHourDto,
  HoursExceptionRequest,
  HoursExceptionResponse,
} from '../../../core/models/booking.models';
import { apiErrorKey } from '../../../core/utils/api-error';
import {
  BayStatus,
  DayKey,
  DaySchedule,
  ScheduleException,
  WashBay,
} from '../models/admin.models';

// el backend numera los días 1 = lunes ... 7 = domingo
const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

// pausa que se propone al activar "con pausa" en un día (el admin la puede cambiar)
const DEFAULT_BREAK = { start: '12:00', end: '13:00' };

/**
 * Fuente única de "Horarios y bahías", con los datos del booking-service.
 *
 * El horario semanal se edita en memoria y se guarda completo con "Guardar cambios"
 * (saveSchedule). Las excepciones y las bahías se guardan una por una; cada método devuelve
 * el Observable para que la pantalla muestre el aviso cuando el backend confirma.
 * El dashboard y la pantalla de operarios leen las bahías de aquí.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleStore {

  private readonly api = inject(BookingApiService);

  private readonly week = signal<DaySchedule[]>([]);
  private readonly exceptionList = signal<ScheduleException[]>([]);
  private readonly bayList = signal<WashBay[]>([]);

  readonly loading = signal(false);
  // llave de traducción del error de carga (null = sin error)
  readonly loadError = signal<string | null>(null);

  readonly weeklySchedule = computed(() => this.week());
  readonly exceptions = computed(() => this.exceptionList());
  readonly bays = computed(() => this.bayList());

  /** horario siempre en el orden lunes → domingo, para pintar la tabla */
  readonly orderedSchedule = computed(() =>
    DAY_ORDER.map(key => this.week().find(d => d.key === key)).filter((d): d is DaySchedule => !!d)
  );

  readonly activeBaysCount = computed(() => this.bayList().filter(b => b.status === 'active').length);

  constructor() {
    this.load();
  }

  /** pide horario, excepciones y bahías al backend */
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      hours: this.api.businessHours(),
      exceptions: this.api.exceptions(),
      bays: this.api.bays(),
    }).subscribe({
      next: ({ hours, exceptions, bays }) => {
        this.week.set(hours.map(toDay));
        this.exceptionList.set(exceptions.map(toException));
        this.bayList.set(bays.map(toBay));
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(apiErrorKey(error));
        this.loading.set(false);
      }
    });
  }

  /** horario de hoy (null si no hay datos) */
  getTodaySchedule(): DaySchedule | undefined {
    const order: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return this.week().find(d => d.key === order[new Date().getDay()]);
  }

  /* ---------- horario semanal (se edita en memoria hasta guardar) ---------- */

  toggleDay(key: DayKey): void {
    this.patchDay(key, day => ({ isWorking: !day.isWorking }));
  }

  setDayField<K extends 'openTime' | 'closeTime' | 'breakStart' | 'breakEnd'>(key: DayKey, field: K, value: DaySchedule[K]): void {
    this.patchDay(key, () => ({ [field]: value } as Partial<DaySchedule>));
  }

  /** activa o quita la pausa del día; al activarla propone 12:00 - 13:00 */
  setDayPause(key: DayKey, withBreak: boolean): void {
    this.patchDay(key, () => withBreak
      ? { pause: 'lunch', breakStart: DEFAULT_BREAK.start, breakEnd: DEFAULT_BREAK.end }
      : { pause: 'none', breakStart: null, breakEnd: null });
  }

  /** vuelve el horario a la última versión guardada */
  resetSchedule(saved: DaySchedule[]): void {
    this.week.set(saved.map(d => ({ ...d })));
  }

  /** guarda la semana completa; el backend valida (pausa dentro del horario, cierre > apertura) */
  saveSchedule(): Observable<DaySchedule[]> {
    const body: BusinessHourDto[] = this.orderedSchedule().map(day => ({
      dayOfWeek: DAY_ORDER.indexOf(day.key) + 1,
      working: day.isWorking,
      opensAt: day.openTime,
      closesAt: day.closeTime,
      breakStartsAt: day.pause === 'lunch' ? day.breakStart : null,
      breakEndsAt: day.pause === 'lunch' ? day.breakEnd : null,
    }));
    return this.api.saveBusinessHours(body).pipe(
      map(hours => hours.map(toDay)),
      tap(week => this.week.set(week)),
      map(week => week.map(d => ({ ...d })))
    );
  }

  /* ---------- bahías ---------- */

  setBayStatus(id: string, status: BayStatus): Observable<WashBay> {
    const bay = this.bayList().find(b => b.id === id);
    return this.updateBay(id, { name: bay?.name ?? '', status });
  }

  addBay(name: string, status: BayStatus): Observable<WashBay> {
    return this.api.createBay(name, toBayStatusCode(status)).pipe(
      map(toBay),
      tap(created => this.bayList.update(list => [...list, created]))
    );
  }

  updateBay(id: string, changes: { name: string; status: BayStatus }): Observable<WashBay> {
    return this.api.updateBay(Number(id), changes.name, toBayStatusCode(changes.status)).pipe(
      map(toBay),
      tap(updated => this.bayList.update(list => list.map(b => (b.id === updated.id ? updated : b))))
    );
  }

  /** el backend no deja borrar una bahía con reservas por delante (BAY_HAS_BOOKINGS) */
  removeBay(id: string): Observable<void> {
    return this.api.deleteBay(Number(id)).pipe(
      tap(() => this.bayList.update(list => list.filter(b => b.id !== id)))
    );
  }

  /* ---------- excepciones ---------- */

  addException(exception: Omit<ScheduleException, 'id' | 'type'>): Observable<ScheduleException> {
    return this.api.createException(toExceptionRequest(exception)).pipe(
      map(toException),
      tap(created => this.exceptionList.update(list => sortByDate([...list, created])))
    );
  }

  updateException(id: string, changes: Omit<ScheduleException, 'id' | 'type'>): Observable<ScheduleException> {
    return this.api.updateException(Number(id), toExceptionRequest(changes)).pipe(
      map(toException),
      tap(updated => this.exceptionList.update(list => sortByDate(list.map(e => (e.id === id ? updated : e)))))
    );
  }

  removeException(id: string): Observable<void> {
    return this.api.deleteException(Number(id)).pipe(
      tap(() => this.exceptionList.update(list => list.filter(e => e.id !== id)))
    );
  }

  /* ---------- internos ---------- */

  private patchDay(key: DayKey, changes: (day: DaySchedule) => Partial<DaySchedule>): void {
    this.week.update(week => week.map(d => (d.key === key ? { ...d, ...changes(d) } : d)));
  }
}

/* ---------- traducción entre el backend y la pantalla ---------- */

function toDay(hour: BusinessHourDto): DaySchedule {
  const hasBreak = !!hour.breakStartsAt && !!hour.breakEndsAt;
  return {
    key: DAY_ORDER[hour.dayOfWeek - 1],
    isWorking: hour.working,
    openTime: hour.opensAt,
    closeTime: hour.closesAt,
    pause: hasBreak ? 'lunch' : 'none',
    breakStart: hour.breakStartsAt,
    breakEnd: hour.breakEndsAt,
  };
}

// festivo = cerrado todo el día; jornada especial = abre con otro horario
function toException(exception: HoursExceptionResponse): ScheduleException {
  return {
    id: String(exception.id),
    date: exception.date,
    type: exception.closed ? 'holiday' : 'special',
    closedAllDay: exception.closed,
    openTime: exception.opensAt ?? '',
    closeTime: exception.closesAt ?? '',
    reason: exception.reason,
  };
}

function toExceptionRequest(exception: Omit<ScheduleException, 'id' | 'type'>): HoursExceptionRequest {
  return {
    date: exception.date,
    closed: exception.closedAllDay,
    opensAt: exception.closedAllDay ? null : exception.openTime,
    closesAt: exception.closedAllDay ? null : exception.closeTime,
    reason: exception.reason,
  };
}

function toBay(bay: BayResponse): WashBay {
  return { id: String(bay.id), code: bay.code, name: bay.name, status: bay.status.toLowerCase() as BayStatus };
}

function toBayStatusCode(status: BayStatus): BayStatusCode {
  return status.toUpperCase() as BayStatusCode;
}

function sortByDate(list: ScheduleException[]): ScheduleException[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}
