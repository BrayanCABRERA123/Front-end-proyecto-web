import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import { Booking, BookingFormValue, BookingStatus } from '../models/admin.models';
import { OperatorsStore } from './operators-store';

const STORAGE_KEY = 'adminBookings';

/** fecha ISO (yyyy-MM-dd) con la cantidad de días indicada respecto a hoy */
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
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

const SEED: Omit<Booking, 'id' | 'email' | 'notes' | 'createdAt'>[] = [
  { code: '#RES-8921', client: 'Sofía Castro', phone: '+57 312 456 7890', vehicle: 'Mazda CX-30', plate: 'NQ-4412', service: 'Premium Especial', date: isoDate(), time: '15:00', durationMin: 60, bay: 'Bahía 3', status: 'confirmed', operator: null, amount: 95000 },
  { code: '#RES-8920', client: 'Juan Felipe González', phone: '+57 300 123 9988', vehicle: 'Audi A4 Sedán', plate: 'KLL-302', service: 'Premium Automóvil', date: isoDate(), time: '15:00', durationMin: 60, bay: 'Bahía 1', status: 'in_progress', operator: { id: 'OP-7310', initials: 'JD', name: 'Juan Díaz' }, amount: 120000 },
  { code: '#RES-8919', client: 'Diego Herrera', phone: '+57 318 890 1122', vehicle: 'Toyota Hilux', plate: 'THX-780', service: 'Desinfección + Tapicería', date: isoDate(), time: '15:00', durationMin: 60, bay: 'Bahía 2', status: 'confirmed', operator: null, amount: 140000 },
  { code: '#RES-8918', client: 'Mariana Gómez', phone: '+57 315 223 3445', vehicle: 'Renault Duster', plate: 'FRT-911', service: 'Lavado General + Polichado', date: isoDate(), time: '15:00', durationMin: 60, bay: 'Bahía 4', status: 'confirmed', operator: { id: 'OP-6120', initials: 'AM', name: 'Andrés Mora' }, amount: 175000 },
  { code: '#RES-8917', client: 'Esneider Sánchez', phone: '+57 311 987 6543', vehicle: 'Chevrolet Tracker', plate: 'MKO-119', service: 'Básico — Camioneta', date: isoDate(), time: '14:00', durationMin: 45, bay: 'Bahía 1', status: 'completed', operator: { id: 'OP-8492', initials: 'CR', name: 'Carlos Ruiz' }, amount: 70000 },
  { code: '#RES-8916', client: 'Carolina Vega', phone: '+57 320 776 2200', vehicle: 'Kia Sportage', plate: 'BHY-209', service: 'Combo Completo SUV', date: isoDate(), time: '13:30', durationMin: 90, bay: null, status: 'cancelled', operator: null, amount: 210000 },
  { code: '#RES-8915', client: 'Laura Ramírez', phone: '+57 301 445 7788', vehicle: 'Nissan Sentra', plate: 'GHT-556', service: 'Lavado Básico', date: isoDate(), time: '12:00', durationMin: 40, bay: 'Bahía 2', status: 'completed', operator: { id: 'OP-7310', initials: 'JD', name: 'Juan Díaz' }, amount: 45000 },
  { code: '#RES-8914', client: 'Cristian Peña', phone: '+57 314 998 0021', vehicle: 'Ford Explorer', plate: 'YTR-330', service: 'Detallado Interior', date: isoDate(), time: '11:30', durationMin: 90, bay: 'Bahía 3', status: 'completed', operator: { id: 'OP-5088', initials: 'MG', name: 'Mateo Gómez' }, amount: 185000 },
  { code: '#RES-8913', client: 'Valentina Ríos', phone: '+57 302 667 4410', vehicle: 'Chevrolet Spark', plate: 'LMK-118', service: 'Encerado', date: isoDate(), time: '17:00', durationMin: 40, bay: 'Bahía 1', status: 'confirmed', operator: null, amount: 85000 },
  { code: '#RES-8912', client: 'Andrés Torres', phone: '+57 317 220 6690', vehicle: 'Mazda BT-50', plate: 'PQR-902', service: 'Combo Completo Camioneta', date: isoDate(), time: '16:30', durationMin: 90, bay: 'Bahía 4', status: 'confirmed', operator: { id: 'OP-6120', initials: 'AM', name: 'Andrés Mora' }, amount: 195000 },
  { code: '#RES-8911', client: 'Natalia Cárdenas', phone: '+57 313 556 8890', vehicle: 'Renault Logan', plate: 'DFT-247', service: 'Lavado Básico', date: isoDate(-1), time: '10:00', durationMin: 40, bay: 'Bahía 2', status: 'completed', operator: { id: 'OP-8492', initials: 'CR', name: 'Carlos Ruiz' }, amount: 45000 },
  { code: '#RES-8910', client: 'Camilo Reyes', phone: '+57 316 774 0091', vehicle: 'Jeep Renegade', plate: 'WQX-115', service: 'Premium Automóvil', date: isoDate(-1), time: '09:00', durationMin: 60, bay: null, status: 'cancelled', operator: null, amount: 120000 },
  { code: '#RES-8909', client: 'Sara Ospina', phone: '+57 305 771 3344', vehicle: 'Toyota Corolla', plate: 'JHK-402', service: 'Lavado Básico', date: isoDate(1), time: '09:30', durationMin: 40, bay: 'Bahía 1', status: 'confirmed', operator: null, amount: 45000 },
  { code: '#RES-8908', client: 'Óscar Rueda', phone: '+57 321 998 1100', vehicle: 'Hyundai Tucson', plate: 'LPP-778', service: 'Lavado General + Encerado', date: isoDate(1), time: '11:00', durationMin: 120, bay: 'Bahía 3', status: 'confirmed', operator: null, amount: 165000 },
];

/**
 * Fuente única de datos de las reservas del administrador.
 *
 * El dashboard, la pantalla de reservas y el calendario de operarios leen de
 * aquí, así que un cambio de estado o una asignación se refleja en todas las
 * vistas sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class ReservationsStore {

  constructor(private operators: OperatorsStore) {}

  private readonly state = signal<Booking[]>(this.load());

  readonly bookings = computed(() =>
    [...this.state()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  );

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

  getByCode(code: string): Booking | undefined {
    return this.state().find(b => b.code === code);
  }

  addBooking(value: BookingFormValue): Booking {
    const operator = value.operatorId ? this.operatorRef(value.operatorId) : null;

    const booking: Booking = {
      id: 'b-' + Date.now(),
      code: this.nextCode(),
      client: value.client,
      phone: value.phone,
      email: value.email,
      vehicle: value.vehicle,
      plate: value.plate,
      service: value.service,
      date: value.date,
      time: value.time,
      durationMin: value.durationMin,
      bay: value.bay,
      status: value.status,
      operator,
      notes: value.notes,
      createdAt: new Date().toISOString(),
      amount: 0,
    };

    this.commit([...this.state(), booking]);
    return booking;
  }

  updateBooking(id: string, value: BookingFormValue): void {
    this.commit(
      this.state().map(b => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...value,
          operator: value.operatorId ? this.operatorRef(value.operatorId) : null,
        };
      })
    );
  }

  setStatus(id: string, status: BookingStatus): void {
    this.commit(
      this.state().map(b => {
        if (b.id !== id) return b;
        // una reserva cancelada o completada no puede quedar con operario
        if (status === 'cancelled' || status === 'completed') return { ...b, status, operator: null };
        return { ...b, status };
      })
    );
  }

  assignOperator(id: string, operatorId: string | null): void {
    this.commit(
      this.state().map(b => (b.id === id ? { ...b, operator: operatorId ? this.operatorRef(operatorId) : null } : b))
    );
  }

  removeBooking(id: string): void {
    this.commit(this.state().filter(b => b.id !== id));
  }

  /** siguiente código libre del tipo #RES-#### */
  nextCode(): string {
    const numbers = this.state()
      .map(b => Number(b.code.replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    return '#RES-' + (numbers.length ? Math.max(...numbers) + 1 : 8900);
  }

  /** referencia corta del operario, taken desde el store de operarios */
  private operatorRef(operatorId: string): Booking['operator'] {
    const operator = this.operators.getById(operatorId);
    return operator ? { id: operator.id, initials: operator.initials, name: operator.name } : null;
  }

  private commit(bookings: Booking[]): void {
    this.state.set(bookings);
    writeStorage(STORAGE_KEY, bookings);
  }

  private load(): Booking[] {
    const stored = readStorage<Booking[] | null>(STORAGE_KEY, null);
    if (stored?.length) return stored;

    return SEED.map(b => ({
      ...b,
      id: 'b-' + b.code.replace(/\D/g, ''),
      email: `${slug(b.client)}@email.com`,
      notes: '',
      createdAt: new Date().toISOString(),
    }));
  }
}

/** nombre en minúsculas sin tildes ni espacios, para armar el correo de ejemplo */
function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join('.');
}
