import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { ScheduleHistoryEntry } from '../../shared/dialogs/schedule-history-modal/schedule-history-modal';

// Admin > Horarios (business_hour, business_hour_exception, service_bay).
// Cada escritura devuelve el estado completo ya actualizado.
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type PauseType = 'none' | 'lunch';

export interface DaySchedule {
  key: DayKey;
  isWorking: boolean;
  openTime: string;
  closeTime: string;
  pause: PauseType;
}

export interface ScheduleException {
  id: string;
  date: string;
  type: 'holiday' | 'special';
  closedAllDay: boolean;
  openTime: string;
  closeTime: string;
  reason: string;
}

export interface WashBay {
  id: string;
  name: string;
  status: 'active' | 'maintenance' | 'inactive';
  currentOperator: string | null;
}

export interface AdminSchedule {
  weeklySchedule: DaySchedule[];
  exceptions: ScheduleException[];
  bays: WashBay[];
  history: ScheduleHistoryEntry[];
}

export type ExceptionInput = Omit<ScheduleException, 'id'>;

@Injectable({ providedIn: 'root' })
export class AdminScheduleService {
  constructor(private api: Api) {}

  get$(): Observable<AdminSchedule> {
    return this.api.get<AdminSchedule>('admin/schedule');
  }

  saveHours$(days: DaySchedule[]): Observable<AdminSchedule> {
    return this.api.put<AdminSchedule>('admin/schedule/hours', { days });
  }

  addException$(exception: ExceptionInput): Observable<AdminSchedule> {
    return this.api.post<AdminSchedule>('admin/schedule/exceptions', exception);
  }

  updateException$(id: string, exception: ExceptionInput): Observable<AdminSchedule> {
    return this.api.put<AdminSchedule>(`admin/schedule/exceptions/${id}`, exception);
  }

  deleteException$(id: string): Observable<AdminSchedule> {
    return this.api.delete<AdminSchedule>(`admin/schedule/exceptions/${id}`);
  }

  setBayStatus$(id: string, status: WashBay['status']): Observable<AdminSchedule> {
    return this.api.patch<AdminSchedule>(`admin/schedule/bays/${id}`, { status });
  }
}
