import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// Modelo único de reserva/servicio — reemplaza los ~5 shapes distintos que existían
// (Reservation, Booking, los objetos ad-hoc de client/history y client/dashboard, etc.)
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface BookingVehicle {
  id: number;
  type: string;
  plate: string;
  brand: string | null;
  model: string | null;
}

export interface BookingServiceLine {
  code: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: number;
  code: string;
  status: BookingStatus;
  scheduledStart: string;
  scheduledEnd: string;
  date: string; // dd/mm/yyyy
  time: string; // HH:mm
  address: string | null;
  vehicle: BookingVehicle | null;
  services: BookingServiceLine[];
  mainService: string | null;
  extras: string[];
  price: number;
  operator: string | null;
  paid: boolean;
  paymentStatus: string | null;
  progress: number;
  rating: number | null;
  canRate: boolean;
  notes: string | null;
}

// La hora de fin la calcula el mock con la duración estimada del servicio.
export interface NewBooking {
  vehicleId: number;
  servicePriceIds: number[];
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  serviceAddress: string;
  notes?: string;
}

// GET /me/booking-options: servicios con precio/duración para el tipo del vehículo elegido.
export interface BookingServiceOption {
  servicePriceId: number;
  code: string;
  name: string;
  description: string;
  price: number;
  estimatedMinutes: number;
}

export interface BookingOptions {
  vehicleId: number;
  mostPopular: string | null;
  services: BookingServiceOption[];
}

// GET /availability: franjas del día según horario de atención y bahías libres.
export interface AvailabilitySlot {
  time: string;
  available: boolean;
  freeBays: number;
}

export interface DayAvailability {
  date: string;
  open: boolean;
  reason: string | null;
  slots: AvailabilitySlot[];
}

@Injectable({ providedIn: 'root' })
export class BookingsService {
  constructor(private api: Api) {}

  myBookings$(): Observable<Booking[]> {
    return this.api.get<Booking[]>('me/bookings');
  }

  create$(booking: NewBooking): Observable<Booking> {
    return this.api.post<Booking>('me/bookings', booking);
  }

  options$(vehicleId: number): Observable<BookingOptions> {
    return this.api.get<BookingOptions>('me/booking-options', { vehicleId });
  }

  availability$(date: string, minutes: number): Observable<DayAvailability> {
    return this.api.get<DayAvailability>('availability', { date, minutes });
  }

  rate$(bookingId: number, rating: number, comment: string): Observable<Booking> {
    return this.api.post<Booking>(`me/bookings/${bookingId}/rating`, { rating, comment });
  }
}
