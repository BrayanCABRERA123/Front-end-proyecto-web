import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AvailableOperator } from '../../../shared/dialogs/assign-operator-modal/assign-operator.model';

import {
  Absence,
  AvailabilitySlot,
  CalendarBlock,
  Operator,
  OperatorStatus,
} from '../models/admin.models';
import {
  AbsenceResponse,
  OperationsApiService,
  OperatorProfileResponse,
  OperatorResponse,
  OperatorSkillDto,
  TeamSummaryResponse,
  localIsoDate,
} from '../../../core/services/operations-api';
import { AuthService } from '../../../core/services/auth';

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

// jornada de referencia para el porcentaje de horas cubiertas
const STANDARD_SHIFT_HOURS = 8;

/**
 * Operarios del lavadero, leídos de operations-service. El nombre, el correo y el teléfono son
 * de la cuenta en security (se editan en Gestión → Usuarios); aquí se manejan el turno semanal,
 * las ausencias y si el operario está activo. La lista, la ficha, el calendario, el dashboard y
 * las reservas leen de esta misma fuente.
 */
@Injectable({ providedIn: 'root' })
export class OperatorsStore {

  private readonly api = inject(OperationsApiService);
  private readonly auth = inject(AuthService);

  private readonly state = signal<Operator[]>([]);

  readonly operators = computed(() => this.state());

  // false hasta que responde operations-service: así una ficha abierta por URL no dice "no encontrado" antes de tiempo
  private readonly loadedState = signal(false);
  readonly loaded = computed(() => this.loadedState());

  // tarjetas de la lista: las calcula operations-service; null mientras carga o si falla
  private readonly summaryState = signal<TeamSummaryResponse | null>(null);
  readonly summary = computed(() => this.summaryState());

  readonly availableOperators = computed(() =>
    this.state().filter(o => o.status !== 'medical_leave')
  );

  constructor() {
    this.refresh();
  }

  /** vuelve a pedir los operarios y sus ausencias (solo con sesión de admin) */
  refresh(): void {
    if (!this.auth.hasAnyRole(['ADMIN'])) return;
    this.api.teamSummary().subscribe({
      next: summary => this.summaryState.set(summary),
      error: () => this.summaryState.set(null)
    });
    this.api.operators().subscribe({
      next: list => {
        if (list.length === 0) {
          this.state.set([]);
          this.loadedState.set(true);
          return;
        }
        // sin perfiles (especialidad y habilidades) los operarios se muestran igual
        forkJoin({
          absences: forkJoin(list.map(o => this.api.absences(o.id).pipe(catchError(() => of([] as AbsenceResponse[]))))),
          profiles: this.api.operatorProfiles().pipe(catchError(() => of([] as OperatorProfileResponse[])))
        }).subscribe(({ absences, profiles }) => {
          const profileById = new Map(profiles.map(p => [p.operatorId, p]));
          this.state.set(list.map((o, i) => toOperator(o, absences[i], profileById.get(o.id) ?? null)));
          this.loadedState.set(true);
        });
      },
      error: () => {
        this.state.set([]);
        this.loadedState.set(true);
      }
    });
  }

  /** guarda la especialidad y las habilidades (operations-service) y recarga la lista */
  saveProfile(id: string, specialty: string, skills: OperatorSkillDto[]): Observable<OperatorProfileResponse> {
    return this.api.updateOperatorProfile(Number(id), specialty.trim() || null, skills)
      .pipe(tap(() => this.refresh()));
  }

  getById(id: string): Operator | undefined {
    return this.state().find(o => o.id === id);
  }

  countByStatus(status: OperatorStatus): number {
    return this.state().filter(o => o.status === status).length;
  }

  /** iniciales a partir del nombre */
  initialsFor(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  /** dar de baja = desactivar (no se borra: tiene servicios y calificaciones) */
  removeOperator(id: string): void {
    this.api.setActive(Number(id), false).subscribe({ next: () => this.refresh() });
  }

  /**
   * reemplaza la disponibilidad semanal (día 0 = lunes en la pantalla, 1 = lunes en el backend);
   * quien llama se suscribe para avisar solo cuando el servidor la guardó
   */
  setAvailability(id: string, availability: AvailabilitySlot[]): Observable<OperatorResponse> {
    const week = availability.map(slot => ({
      dayOfWeek: slot.day + 1,
      startsAt: slot.startTime,
      endsAt: slot.endTime
    }));
    return this.api.setAvailability(Number(id), week).pipe(tap(() => this.refresh()));
  }

  /** ausencia de días completos: del inicio del primer día al final del último */
  addAbsence(id: string, absence: Omit<Absence, 'id'>): Observable<AbsenceResponse> {
    const end = new Date(absence.endDate + 'T00:00:00');
    end.setDate(end.getDate() + 1);
    return this.api.addAbsence(Number(id), absence.startDate + 'T00:00:00', localIsoDate(end) + 'T00:00:00', absence.reason)
      .pipe(tap(() => this.refresh()));
  }

  removeAbsence(id: string, absenceId: string): void {
    this.api.removeAbsence(Number(id), Number(absenceId)).subscribe({ next: () => this.refresh() });
  }

  /**
   * operarios para el modal de asignar una reserva, con la disponibilidad que calcula
   * operations-service (la misma regla con la que después valida la asignación)
   */
  candidatesFor(bookingId: string): Observable<AvailableOperator[]> {
    return this.api.candidates(Number(bookingId)).pipe(
      map(list => list.map(c => ({
        id: String(c.operatorId),
        initials: c.fullName.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''),
        name: c.fullName,
        specialty: '',
        rating: c.averageRating ?? 0,
        availability: c.available ? 'available' : 'unavailable',
        availabilityNote: c.unavailableReason ? 'ASSIGN_OPERATOR_MODAL.REASONS.' + c.unavailableReason : undefined,
      } as AvailableOperator)))
    );
  }

  /** horas estándar que debería cubrir el operario según su disponibilidad */
  get totalShiftHours(): number {
    return STANDARD_SHIFT_HOURS * 6;
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

const hhmm = (time: string) => time.slice(0, 5);

// operario de operations-service -> modelo de las pantallas del admin
function toOperator(o: OperatorResponse, absences: AbsenceResponse[], profile: OperatorProfileResponse | null): Operator {
  const today = localIsoDate(new Date());
  const mapped: Absence[] = absences.map(a => {
    const end = new Date(a.endsAt);
    end.setMinutes(end.getMinutes() - 1); // el fin es exclusivo: el último día cubierto
    return { id: String(a.id), startDate: localIsoDate(new Date(a.startsAt)), endDate: localIsoDate(end), reason: a.reason };
  });
  const absentToday = mapped.some(a => a.startDate <= today && today <= a.endDate);
  const availability: AvailabilitySlot[] = o.week.map(s => ({
    day: s.dayOfWeek - 1,
    startTime: hhmm(s.startsAt),
    endTime: hhmm(s.endsAt)
  }));
  const calendarBlocks: CalendarBlock[] = availability
    .filter(s => s.day <= 5)
    .map(s => ({ day: s.day, startTime: s.startTime, endTime: s.endTime, type: 'available' } as CalendarBlock));
  const name = o.fullName || `Operario ${o.id}`;
  return {
    id: String(o.id),
    name,
    initials: name.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''),
    specialty: profile?.specialty ?? '',
    rating: o.averageRating ?? 0,
    reviewsCount: o.ratingsCount,
    status: absentToday ? 'medical_leave' : 'available',
    bay: null,
    weeklyServices: o.completedServices,
    tags: o.active ? [] : ['Inactivo'],
    phone: o.phone,
    email: o.email,
    // el nivel viaja como código (CERTIFIED, EXPERT, ADVANCED): la pantalla lo traduce
    certifications: (profile?.skills ?? []).map(skill => ({ name: skill.name, level: skill.level })),
    todayServices: [],
    calendarBlocks,
    availability,
    absences: mapped,
  };
}
