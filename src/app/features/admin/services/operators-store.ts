import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { Api } from '../../../core/services/api';

export type OperatorStatus = 'available' | 'in_service' | 'medical_leave';

export interface TodayService {
  code: string;
  vehicle: string;
  service: string;
  bay: string;
  time: string;
  status: 'completed' | 'in_progress' | 'scheduled';
}

export interface Certification {
  name: string;
  level: string;
}

export type CalendarBlockType = 'available' | 'service' | 'leave' | 'lunch';

export interface CalendarBlock {
  day: number; // 0 = lunes ... 5 = sábado
  startTime: string;
  endTime: string;
  type: CalendarBlockType;
  label: string;
  bay?: string;
}

export interface Operator {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  status: OperatorStatus;
  bay: string | null;
  weeklyServices: number;
  weeklyServicesChange: number;
  tags: string[];
  featured?: boolean;
  phone: string;
  email: string;
  availableHours: number;
  totalHours: number;
  punctuality: number;
  weeklyRevenue: number;
  weeklyGoalPercent: number;
  certifications: Certification[];
  todayServices: TodayService[];
  calendarBlocks: CalendarBlock[];
}

// Fuente única de operarios para toda la sección admin (dashboard, lista, detalle, calendario,
// reservas). Los datos vienen de mock-api (server.cjs), que ya resuelve agenda semanal, servicios
// de hoy y KPIs a partir de operatorAvailability/bookings/serviceExecutions — ver mock-api/computed.cjs.
@Injectable({ providedIn: 'root' })
export class OperatorsStore {

  // snapshot síncrono para los getters existentes; se llena cuando list$() recibe la primera respuesta
  operators: Operator[] = [];

  private operators$!: Observable<Operator[]>;

  constructor(private api: Api) {
    // ojo: no se puede armar operators$ como inicializador de campo — correría antes de que
    // el constructor asigne `this.api`, y api.get() explotaría contra `undefined`.
    this.invalidate();
  }

  // Descarta la caché: la próxima suscripción vuelve a pedir GET /operators. Se llama cuando
  // Gestión crea, habilita/inhabilita o elimina una cuenta de operario.
  invalidate(): void {
    this.operators$ = this.api.get<Operator[]>('operators').pipe(
      tap(ops => (this.operators = ops)),
      shareReplay(1)
    );
  }

  // Observable compartido (shareReplay): un solo GET /operators sin importar cuántos
  // componentes se suscriban ni en qué orden.
  list$(): Observable<Operator[]> {
    return this.operators$;
  }

  getById(id: string): Operator | undefined {
    return this.operators.find(o => o.id === id);
  }

  // Para páginas de detalle: pide solo ese operario (mock-api/computed.cjs resuelve el mismo
  // cómputo para GET /operators/:id), sin depender de que la lista completa ya esté cargada.
  getById$(id: string): Observable<Operator> {
    return this.api.get<Operator>(`operators/${id}`);
  }
}
