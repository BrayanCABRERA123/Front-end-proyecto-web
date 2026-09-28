import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import {
  Absence,
  AvailabilitySlot,
  Operator,
  OperatorStatus,
} from '../models/admin.models';

// los tipos siguen exportándose desde aquí para no romper los imports que ya
// usan los componentes de operarios
export type {
  Operator,
  OperatorStatus,
  TodayService,
  Certification,
  CalendarBlock,
  CalendarBlockType,
  AvailabilitySlot,
  Absence,
} from '../models/admin.models';

const STORAGE_KEY = 'adminOperators';

/** datos que se pueden cambiar desde la interfaz de administración */
export interface OperatorFormValue {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  status: OperatorStatus;
  bay: string | null;
  tags: string[];
}

interface SeedOperator extends Omit<Operator, 'availability' | 'absences'> {
  availability: AvailabilitySlot[];
  absences: Absence[];
}

// roster inicial de operarios (mismos que ya se usaban en el dashboard y reservas)
const SEED: SeedOperator[] = [
  {
    id: 'OP-8492',
    name: 'Carlos Ruiz',
    initials: 'CR',
    specialty: 'Técnico Detailing Especializado & Corrección de Barniz',
    rating: 4.9,
    reviewsCount: 84,
    status: 'available',
    bay: 'Bahía 1 (Doble)',
    weeklyServices: 18,
    weeklyServicesChange: 12,
    tags: ['Pulido cerámico', 'Corrección barniz'],
    phone: '+57 314 789 2045',
    email: 'c.ruiz@lavadovehicular.co',
    availableHours: 38,
    totalHours: 44,
    punctuality: 98.5,
    weeklyRevenue: 1420000,
    weeklyGoalPercent: 104,
    certifications: [
      { name: 'Detailing Cerámico 9H', level: 'Certificado' },
      { name: 'Limpieza tapicería a vapor', level: 'Nivel Experto' },
      { name: 'Corrección de pintura en 3 pasos', level: 'Avanzado' },
    ],
    todayServices: [
      { code: '#8910', vehicle: 'Mazda CX-30', service: 'Lavado Premium Especializado', bay: 'Bahía 1', time: '08:00 - 10:30', status: 'completed' },
      { code: '#8935', vehicle: 'BMW X3 (Especial)', service: 'Detailing Cerámico + Corrección', bay: 'Bahía 1 (Doble)', time: '11:30 - 14:00', status: 'in_progress' },
      { code: '#8962', vehicle: 'Mazda CX-30 · Sofía Castro', service: 'Desinfección Total & Ozono', bay: 'Bahía 1', time: '14:30 - 16:30', status: 'scheduled' },
    ],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '10:30', type: 'service', label: '#8910 · Mazda CX-30 · Lavado Premium', bay: 'Bahía 1' },
      { day: 0, startTime: '10:30', endTime: '13:00', type: 'available', label: 'Disponible' },
      { day: 0, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
      { day: 0, startTime: '14:00', endTime: '16:30', type: 'available', label: 'Disponible' },
      { day: 1, startTime: '08:00', endTime: '11:30', type: 'service', label: '#8935 · BMW X3 · Detailing Cerámico', bay: 'Bahía 1 (Doble)' },
      { day: 1, startTime: '11:30', endTime: '13:00', type: 'available', label: 'Disponible' },
      { day: 1, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
      { day: 1, startTime: '14:00', endTime: '17:00', type: 'service', label: '#8948 · Kia Sportage · Encerado Orbital', bay: 'Bahía 2' },
      { day: 2, startTime: '08:00', endTime: '13:00', type: 'leave', label: 'Permiso médico · Control oftalmológico' },
      { day: 2, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
      { day: 2, startTime: '14:00', endTime: '18:00', type: 'available', label: 'Reincorpora tras cita médica' },
      { day: 3, startTime: '08:00', endTime: '11:00', type: 'service', label: '#8955 · Renault Duster · Lavado Express', bay: 'Bahía 1' },
      { day: 3, startTime: '11:00', endTime: '13:00', type: 'available', label: 'Disponible' },
      { day: 3, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
      { day: 3, startTime: '14:00', endTime: '16:30', type: 'service', label: '#8921 · Sofía Castro · Mazda CX-30', bay: 'Bahía 1 (Doble)' },
      { day: 3, startTime: '16:30', endTime: '18:00', type: 'available', label: 'Disponible' },
      { day: 4, startTime: '08:00', endTime: '12:00', type: 'available', label: 'Mañana libre' },
      { day: 4, startTime: '12:00', endTime: '13:00', type: 'service', label: '#8960 · Chevrolet Spark', bay: 'Bahía 1' },
      { day: 4, startTime: '13:00', endTime: '14:00', type: 'lunch', label: 'Almuerzo' },
      { day: 4, startTime: '14:00', endTime: '17:30', type: 'service', label: '#8962 · Ford Explorer · Detailing Interior', bay: 'Bahía 1' },
      { day: 5, startTime: '08:00', endTime: '11:00', type: 'service', label: '#8970 · Mercedes G', bay: 'Bahía 2' },
      { day: 5, startTime: '11:00', endTime: '14:00', type: 'available', label: 'Disponible fin de semana' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '14:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
      { day: 5, startTime: '08:00', endTime: '14:00' },
    ],
    absences: [],
  },
  {
    id: 'OP-7310',
    name: 'Juan Díaz',
    initials: 'JD',
    specialty: 'Lavador Especialista',
    rating: 4.8,
    reviewsCount: 54,
    status: 'in_service',
    bay: 'Bahía 2',
    weeklyServices: 14,
    weeklyServicesChange: 6,
    tags: ['Lavado en espuma', 'Secado hidro'],
    phone: '+57 300 445 8821',
    email: 'j.diaz@lavadovehicular.co',
    availableHours: 40,
    totalHours: 44,
    punctuality: 95.2,
    weeklyRevenue: 980000,
    weeklyGoalPercent: 88,
    certifications: [{ name: 'Lavado en espuma activa', level: 'Certificado' }],
    todayServices: [
      { code: '#8901', vehicle: 'Audi A4 Sedán', service: 'Premium Automóvil', bay: 'Bahía 2', time: '15:00 - 16:00', status: 'in_progress' },
    ],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '18:00', type: 'service', label: 'Turno completo · Bahía 2', bay: 'Bahía 2' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
    ],
    absences: [],
  },
  {
    id: 'OP-6120',
    name: 'Andrés Mora',
    initials: 'AM',
    specialty: 'Lavado General & Encerado',
    rating: 4.7,
    reviewsCount: 42,
    status: 'available',
    bay: 'Bahía 3',
    weeklyServices: 16,
    weeklyServicesChange: 4,
    tags: ['Cera Carnauba', 'Limpieza vidrios'],
    phone: '+57 317 220 6690',
    email: 'a.mora@lavadovehicular.co',
    availableHours: 42,
    totalHours: 44,
    punctuality: 97.1,
    weeklyRevenue: 860000,
    weeklyGoalPercent: 91,
    certifications: [{ name: 'Encerado con cera Carnauba', level: 'Nivel Experto' }],
    todayServices: [],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '18:00', type: 'available', label: 'Disponible' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
      { day: 5, startTime: '08:00', endTime: '18:00' },
    ],
    absences: [],
  },
  {
    id: 'OP-5088',
    name: 'Mateo Gómez',
    initials: 'MG',
    specialty: 'Tapicería e Interiores',
    rating: 4.6,
    reviewsCount: 38,
    status: 'medical_leave',
    bay: null,
    weeklyServices: 0,
    weeklyServicesChange: -100,
    tags: ['Limpieza a vapor', 'Hidratación cuero'],
    phone: '+57 313 556 8890',
    email: 'm.gomez@lavadovehicular.co',
    availableHours: 0,
    totalHours: 44,
    punctuality: 92.4,
    weeklyRevenue: 0,
    weeklyGoalPercent: 0,
    certifications: [{ name: 'Hidratación de cuero', level: 'Certificado' }],
    todayServices: [],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '18:00', type: 'leave', label: 'Incapacidad médica' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
    ],
    absences: [
      { id: 'ab-1', startDate: '2026-09-14', endDate: '2026-10-02', reason: 'Incapacidad médica' },
    ],
  },
  {
    id: 'OP-4477',
    name: 'Camilo Restrepo',
    initials: 'CR',
    specialty: 'Lavado Motor & Chasis',
    rating: 4.8,
    reviewsCount: 62,
    status: 'in_service',
    bay: 'Bahía 1 (Doble)',
    weeklyServices: 15,
    weeklyServicesChange: 9,
    tags: ['Desengrase dieléctrico', 'Grafitado ecológico'],
    phone: '+57 316 774 0091',
    email: 'c.restrepo@lavadovehicular.co',
    availableHours: 36,
    totalHours: 44,
    punctuality: 94.0,
    weeklyRevenue: 1010000,
    weeklyGoalPercent: 95,
    certifications: [{ name: 'Desengrase de motor', level: 'Certificado' }],
    todayServices: [],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '18:00', type: 'service', label: 'Turno completo · Bahía 1 (Doble)', bay: 'Bahía 1 (Doble)' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
    ],
    absences: [],
  },
  {
    id: 'OP-3305',
    name: 'Sofía Valencia',
    initials: 'SV',
    specialty: 'Tratamiento Cerámico y PPF',
    rating: 5.0,
    reviewsCount: 110,
    status: 'available',
    bay: 'Bahía 2',
    weeklyServices: 21,
    weeklyServicesChange: 18,
    tags: ['Coating 9H', 'PPF Frontal'],
    featured: true,
    phone: '+57 302 667 4410',
    email: 's.valencia@lavadovehicular.co',
    availableHours: 41,
    totalHours: 44,
    punctuality: 99.1,
    weeklyRevenue: 1680000,
    weeklyGoalPercent: 121,
    certifications: [
      { name: 'Coating cerámico 9H', level: 'Certificado' },
      { name: 'Instalación de PPF', level: 'Nivel Experto' },
    ],
    todayServices: [],
    calendarBlocks: [
      { day: 0, startTime: '08:00', endTime: '18:00', type: 'available', label: 'Disponible' },
    ],
    availability: [
      { day: 0, startTime: '08:00', endTime: '18:00' },
      { day: 1, startTime: '08:00', endTime: '18:00' },
      { day: 2, startTime: '08:00', endTime: '18:00' },
      { day: 3, startTime: '08:00', endTime: '18:00' },
      { day: 4, startTime: '08:00', endTime: '18:00' },
      { day: 5, startTime: '08:00', endTime: '18:00' },
    ],
    absences: [],
  },
];

// duración de un turno estándar, usada para calcular las horas disponibles
const STANDARD_SHIFT_HOURS = 10;

/**
 * Fuente única de datos del equipo de operarios.
 *
 * La usan la lista, la ficha, el calendario, la reserva de bahías y el módulo de
 * asignación, de modo que un cambio de estado se ve reflejado en todas partes
 * sin recargar. Al conectar el backend se sustituyen los métodos por llamadas
 * HTTP manteniendo las mismas firmas.
 */
@Injectable({ providedIn: 'root' })
export class OperatorsStore {

  private readonly state = signal<Operator[]>(this.load());

  readonly operators = computed(() => this.state());

  readonly availableOperators = computed(() =>
    this.state().filter(o => o.status !== 'medical_leave')
  );

  getById(id: string): Operator | undefined {
    return this.state().find(o => o.id === id);
  }

  countByStatus(status: OperatorStatus): number {
    return this.state().filter(o => o.status === status).length;
  }

  /** iniciales a partir del nombre, para las fichas nuevas */
  initialsFor(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  addOperator(value: OperatorFormValue): Operator {
    const operator: Operator = {
      id: this.nextId(),
      name: value.name,
      initials: this.initialsFor(value.name),
      specialty: value.specialty,
      rating: 0,
      reviewsCount: 0,
      status: value.status,
      bay: value.bay,
      weeklyServices: 0,
      weeklyServicesChange: 0,
      tags: value.tags,
      phone: value.phone,
      email: value.email,
      availableHours: 0,
      totalHours: 44,
      punctuality: 0,
      weeklyRevenue: 0,
      weeklyGoalPercent: 0,
      certifications: [],
      todayServices: [],
      calendarBlocks: [],
      availability: [],
      absences: [],
    };

    this.commit([...this.state(), operator]);
    return operator;
  }

  updateOperator(id: string, changes: Partial<OperatorFormValue>): void {
    this.commit(
      this.state().map(o => {
        if (o.id !== id) return o;

        const name = changes.name ?? o.name;
        return {
          ...o,
          ...changes,
          name,
          // si cambia el nombre, las iniciales se recalculan
          initials: changes.name ? this.initialsFor(name) : o.initials,
          // una persona incapacitada o en servicio no puede tener bahía fija
          bay: (changes.status ?? o.status) === 'medical_leave' ? null : (changes.bay ?? o.bay),
        };
      })
    );
  }

  setStatus(id: string, status: OperatorStatus): void {
    this.updateOperator(id, { status });
  }

  assignBay(id: string, bay: string | null): void {
    this.commit(
      this.state().map(o => {
        if (o.id === id) return { ...o, bay };
        // una bahía solo admite un operario: se libera de los demás
        if (bay && o.bay === bay) return { ...o, bay: null };
        return o;
      })
    );
  }

  removeOperator(id: string): void {
    this.commit(this.state().filter(o => o.id !== id));
  }

  /** reemplaza la disponibilidad semanal y recalcula las horas disponibles */
  setAvailability(id: string, availability: AvailabilitySlot[]): void {
    const hours = availability.reduce((sum, slot) => sum + toHours(slot.startTime, slot.endTime), 0);

    this.commit(
      this.state().map(o => (o.id === id ? { ...o, availability, availableHours: hours } : o))
    );
  }

  addAbsence(id: string, absence: Omit<Absence, 'id'>): Absence {
    const created: Absence = { id: 'ab-' + Date.now(), ...absence };
    this.commit(
      this.state().map(o => (o.id === id ? { ...o, absences: [...o.absences, created] } : o))
    );
    return created;
  }

  removeAbsence(id: string, absenceId: string): void {
    this.commit(
      this.state().map(o =>
        o.id === id ? { ...o, absences: o.absences.filter(a => a.id !== absenceId) } : o
      )
    );
  }

  /** horas estándar que debería cubrir el operario según su disponibilidad */
  get totalShiftHours(): number {
    return STANDARD_SHIFT_HOURS * 6;
  }

  private nextId(): string {
    const numbers = this.state()
      .map(o => Number(o.id.replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    return 'OP-' + (numbers.length ? Math.max(...numbers) + 1 : 1000);
  }

  private commit(operators: Operator[]): void {
    this.state.set(operators);
    writeStorage(STORAGE_KEY, operators);
  }

  private load(): Operator[] {
    const stored = readStorage<Operator[] | null>(STORAGE_KEY, null);
    if (stored?.length) return stored;
    // copia profunda para que el store no comparta referencias con la semilla
    return JSON.parse(JSON.stringify(SEED)) as Operator[];
  }
}

/** horas entre dos marcas HH:mm (soporta turnos que cruzan la medianoche) */
export function toHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}
