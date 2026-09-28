import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import { ScheduleHistoryEntry } from '../../../shared/dialogs/schedule-history-modal/schedule-history.model';
import {
  BayStatus,
  DayKey,
  DaySchedule,
  ScheduleException,
  WashBay,
} from '../models/admin.models';

const STORAGE_KEY = 'adminSchedule';

interface PersistedSchedule {
  weeklySchedule: DaySchedule[];
  exceptions: ScheduleException[];
  bays: WashBay[];
  history: ScheduleHistoryEntry[];
}

const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Estado inicial de la semana, con los mismos valores que ya traía la pantalla. */
const DEFAULT_WEEK: DaySchedule[] = [
  { key: 'monday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
  { key: 'tuesday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
  { key: 'wednesday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
  { key: 'thursday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
  { key: 'friday', isWorking: true, openTime: '07:30', closeTime: '19:00', pause: 'none' },
  { key: 'saturday', isWorking: true, openTime: '08:00', closeTime: '18:00', pause: 'none' },
  { key: 'sunday', isWorking: false, openTime: '08:00', closeTime: '14:00', pause: 'none' },
];

const DEFAULT_EXCEPTIONS: ScheduleException[] = [
  { id: 'ex1', date: '2026-11-11', type: 'holiday', closedAllDay: true, openTime: '', closeTime: '', reason: 'Día de la Independencia de Cartagena' },
  { id: 'ex2', date: '2026-12-08', type: 'special', closedAllDay: false, openTime: '09:00', closeTime: '14:00', reason: 'Inmaculada Concepción · Jornada corta' },
  { id: 'ex3', date: '2026-12-25', type: 'holiday', closedAllDay: true, openTime: '', closeTime: '', reason: 'Navidad - No laboral obligatorio' },
];

const DEFAULT_BAYS: WashBay[] = [
  { id: 'b1', name: 'Bahía 1', status: 'active', currentOperator: 'Juan Díaz' },
  { id: 'b2', name: 'Bahía 2', status: 'active', currentOperator: 'Carlos Ruiz' },
  { id: 'b3', name: 'Bahía 3', status: 'active', currentOperator: null },
  { id: 'b4', name: 'Bahía 4', status: 'maintenance', currentOperator: null },
];

const DEFAULT_HISTORY: ScheduleHistoryEntry[] = [
  { date: '15/09/2026', author: 'Laura Méndez', reason: 'SCHEDULE_HISTORY.REASON.HOURS_UPDATED' },
  { date: '02/09/2026', author: 'Laura Méndez', reason: 'SCHEDULE_HISTORY.REASON.EXCEPTION_ADDED', detail: 'Navidad' },
  { date: '20/08/2026', author: 'Laura Méndez', reason: 'SCHEDULE_HISTORY.REASON.BAY_MAINTENANCE', detail: 'Bahía 4' },
];

/**
 * Fuente única de datos de "Horarios y bahías".
 *
 * Concentra el horario semanal, las excepciones, las bahías y el historial de
 * cambios para que la pantalla solo tenga lógica de presentación. Al conectar el
 * backend basta con reemplazar el cuerpo de los métodos por llamadas HTTP
 * conservando las firmas.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleStore {

  private readonly state = signal<PersistedSchedule>(this.load());

  readonly weeklySchedule = computed(() => this.state().weeklySchedule);
  readonly exceptions = computed(() => this.state().exceptions);
  readonly bays = computed(() => this.state().bays);
  readonly history = computed(() => this.state().history);

  /** horario siempre en el orden lunes → domingo, para pintar la tabla */
  readonly orderedSchedule = computed(() =>
    DAY_ORDER.map(key => this.state().weeklySchedule.find(d => d.key === key)!).filter(Boolean)
  );

  readonly activeBaysCount = computed(() => this.state().bays.filter(b => b.status === 'active').length);

  /** día de la semana en que la bahía está abierta, o null si está cerrada */
  getTodaySchedule(): DaySchedule | undefined {
    const order: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return this.state().weeklySchedule.find(d => d.key === order[new Date().getDay()]);
  }

  /* ---------- horario semanal ---------- */

  toggleDay(key: DayKey): void {
    // sin pasar el key, patchSchedule aplicaba el cambio a todos los días a la vez
    this.patchSchedule({ isWorking: !this.findDay(key)?.isWorking }, key);
  }

  setDayField<K extends 'openTime' | 'closeTime' | 'pause'>(key: DayKey, field: K, value: DaySchedule[K]): void {
    this.patchSchedule({ [field]: value } as Partial<DaySchedule>, key);
  }

  /** vuelve el horario a la última versión guardada con "Guardar cambios" */
  resetSchedule(saved: DaySchedule[]): void {
    this.update({ weeklySchedule: saved.map(d => ({ ...d })) });
  }

  saveSchedule(): DaySchedule[] {
    const snapshot = this.state().weeklySchedule.map(d => ({ ...d }));
    this.addHistory('SCHEDULE_HISTORY.REASON.SCHEDULE_SAVED');
    return snapshot;
  }

  /* ---------- bahías ---------- */

  /** único punto de cambio de estado: lo usan el select, el alta y la edición */
  setBayStatus(id: string, status: BayStatus): void {
    const bays = this.state().bays.map(b =>
      b.id === id
        // una bahía que no está activa no puede tener operario asignado
        ? { ...b, status, currentOperator: status === 'active' ? b.currentOperator : null }
        : b
    );

    const bay = this.state().bays.find(b => b.id === id);
    this.update({ bays });
    if (bay) this.addHistory('SCHEDULE_HISTORY.REASON.BAY_STATUS', bay.name);
  }

  addBay(name: string, status: BayStatus, currentOperator: string | null): WashBay {
    const bay: WashBay = {
      id: 'b' + (this.state().bays.length + 1) + '-' + Date.now(),
      name,
      status,
      currentOperator: status === 'active' ? currentOperator : null,
    };
    this.update({ bays: [...this.state().bays, bay] });
    this.addHistory('SCHEDULE_HISTORY.REASON.BAY_ADDED', bay.name);
    return bay;
  }

  updateBay(id: string, changes: Partial<Omit<WashBay, 'id'>>): void {
    this.update({
      bays: this.state().bays.map(b =>
        b.id === id
          ? { ...b, ...changes, currentOperator: (changes.status ?? b.status) === 'active' ? changes.currentOperator ?? b.currentOperator : null }
          : b
      ),
    });
  }

  removeBay(id: string): void {
    const bay = this.state().bays.find(b => b.id === id);
    this.update({ bays: this.state().bays.filter(b => b.id !== id) });
    if (bay) this.addHistory('SCHEDULE_HISTORY.REASON.BAY_REMOVED', bay.name);
  }

  /** siguiente número libre de bahía, para sugerir un nombre al crear */
  nextBayName(): string {
    return 'Bahía ' + (this.state().bays.length + 1);
  }

  /* ---------- excepciones ---------- */

  addException(exception: Omit<ScheduleException, 'id'>): ScheduleException {
    const created: ScheduleException = { id: 'ex' + Date.now(), ...exception };
    this.update({
      exceptions: [...this.state().exceptions, created].sort((a, b) => a.date.localeCompare(b.date)),
    });
    this.addHistory('SCHEDULE_HISTORY.REASON.EXCEPTION_ADDED', created.reason);
    return created;
  }

  updateException(id: string, changes: Omit<ScheduleException, 'id'>): void {
    this.update({
      exceptions: this.state()
        .exceptions.map(e => (e.id === id ? { id, ...changes } : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  removeException(id: string): void {
    const exception = this.state().exceptions.find(e => e.id === id);
    this.update({ exceptions: this.state().exceptions.filter(e => e.id !== id) });
    if (exception) this.addHistory('SCHEDULE_HISTORY.REASON.EXCEPTION_REMOVED', exception.reason);
  }

  /* ---------- historial ---------- */

  private addHistory(reason: string, detail?: string): void {
    const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const entry: ScheduleHistoryEntry = { date: today, author: 'Laura Méndez', reason, detail };
    this.update({ history: [entry, ...this.state().history].slice(0, 20) });
  }

  /* ---------- internos ---------- */

  private findDay(key: DayKey): DaySchedule | undefined {
    return this.state().weeklySchedule.find(d => d.key === key);
  }

  private patchSchedule(changes: Partial<DaySchedule>, key?: DayKey): void {
    this.update({
      weeklySchedule: this.state().weeklySchedule.map(d =>
        d.key === (key ?? d.key) ? { ...d, ...changes } : d
      ),
    });
  }

  private update(changes: Partial<PersistedSchedule>): void {
    const next = { ...this.state(), ...changes };
    this.state.set(next);
    writeStorage(STORAGE_KEY, next);
  }

  private load(): PersistedSchedule {
    return readStorage<PersistedSchedule>(STORAGE_KEY, {
      weeklySchedule: DEFAULT_WEEK,
      exceptions: DEFAULT_EXCEPTIONS,
      bays: DEFAULT_BAYS,
      history: DEFAULT_HISTORY,
    });
  }
}
