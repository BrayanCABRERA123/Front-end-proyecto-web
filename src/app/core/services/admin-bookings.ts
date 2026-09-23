import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';
import { AvailableOperator } from '../../shared/dialogs/assign-operator-modal/assign-operator.model';

// Admin > Reservas. El mock calcula los contadores del día, el tiempo relativo
// y qué operarios pueden tomar cada reserva (horario, ausencias, cruces).
export type AdminBookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface AdminBooking {
  id: number;
  code: string;
  client: string;
  phone: string | null;
  vehicle: string;
  vehicleType: string | null;
  plate: string;
  service: string;
  address: string | null;
  isoDate: string; // yyyy-mm-dd
  date: string; // dd/mm/yyyy
  timeRange: string;
  relative: { key: string; params: Record<string, number> };
  bay: string;
  status: AdminBookingStatus;
  operator: { id: string; initials: string; name: string } | null;
  amount: number;
}

export interface AdminBookingsDay {
  stats: { total: number; confirmedInProgress: number; unassigned: number; cancelled: number };
  operatorNames: string[];
  items: AdminBooking[];
}

@Injectable({ providedIn: 'root' })
export class AdminBookingsService {
  constructor(private api: Api) {}

  // date vacío = todas las reservas
  list$(date: string): Observable<AdminBookingsDay> {
    return this.api.get<AdminBookingsDay>('admin/bookings', date ? { date } : undefined);
  }

  operatorOptions$(bookingId: number): Observable<AvailableOperator[]> {
    return this.api.get<AvailableOperator[]>(`admin/bookings/${bookingId}/operator-options`);
  }

  assign$(bookingId: number, operatorId: string, notes: string): Observable<AdminBooking> {
    return this.api.post<AdminBooking>(`admin/bookings/${bookingId}/assign`, { operatorId, notes });
  }
}
