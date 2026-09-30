import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import {
  AvailabilityResponse,
  BayResponse,
  BayStatusCode,
  BookingResponse,
  BookingStatusCode,
  BusinessHourDto,
  CatalogServiceRequest,
  CatalogServiceResponse,
  CreateBookingRequest,
  EstablishmentResponse,
  HoursExceptionRequest,
  HoursExceptionResponse,
  OwnedVehicleResponse,
  RescheduleBookingRequest,
  ServiceCategoryResponse,
  SlotUnavailableProblem,
} from '../models/booking.models';

// habla con el booking-service (catálogo, horario, bahías y reservas) y con el endpoint del
// customer-service que busca vehículos de cualquier cliente (solo admin).
// el id del cliente nunca viaja: el backend lo saca del token.
@Injectable({
  providedIn: 'root',
})
export class BookingApiService {

  private readonly http = inject(HttpClient);
  private readonly api = API_BASE_URL;

  // los datos de la sede casi no cambian: se piden una vez por sesión
  private establishment$?: Observable<EstablishmentResponse>;

  /* ---------- público ---------- */

  categories(): Observable<ServiceCategoryResponse[]> {
    return this.http.get<ServiceCategoryResponse[]>(`${this.api}/catalog/categories`);
  }

  // servicios activos; con vehicleTypeId solo viene el precio de ese tipo de vehículo
  services(vehicleTypeId?: number): Observable<CatalogServiceResponse[]> {
    let params = new HttpParams();
    if (vehicleTypeId) params = params.set('vehicleTypeId', vehicleTypeId);
    return this.http.get<CatalogServiceResponse[]>(`${this.api}/catalog/services`, { params });
  }

  businessHours(): Observable<BusinessHourDto[]> {
    return this.http.get<BusinessHourDto[]>(`${this.api}/schedule/business-hours`);
  }

  exceptions(from?: string): Observable<HoursExceptionResponse[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    return this.http.get<HoursExceptionResponse[]>(`${this.api}/schedule/exceptions`, { params });
  }

  establishment(): Observable<EstablishmentResponse> {
    this.establishment$ ??= this.http.get<EstablishmentResponse>(`${this.api}/establishment`).pipe(shareReplay(1));
    return this.establishment$;
  }

  /* ---------- reservas del cliente ---------- */

  availability(date: string, vehicleTypeId: number, serviceIds: number[], excludeBookingId?: number): Observable<AvailabilityResponse> {
    let params = new HttpParams()
      .set('date', date)
      .set('vehicleTypeId', vehicleTypeId)
      .set('serviceIds', serviceIds.join(','));
    if (excludeBookingId) params = params.set('excludeBookingId', excludeBookingId);
    return this.http.get<AvailabilityResponse>(`${this.api}/bookings/availability`, { params });
  }

  createBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.api}/bookings`, request);
  }

  myBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.api}/bookings/me`);
  }

  cancelMyBooking(id: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.api}/bookings/${id}/cancel`, {});
  }

  rescheduleMyBooking(id: number, request: RescheduleBookingRequest): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.api}/bookings/${id}`, request);
  }

  cancellationReasons(): Observable<{ code: string; name: string }[]> {
    return this.http.get<{ code: string; name: string }[]>(`${this.api}/bookings/cancellation-reasons`);
  }

  /* ---------- admin: reservas ---------- */

  adminBookings(from: string, to: string, status?: BookingStatusCode): Observable<BookingResponse[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get<BookingResponse[]>(`${this.api}/admin/bookings`, { params });
  }

  adminCreateBooking(request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.api}/admin/bookings`, request);
  }

  adminReschedule(id: number, request: RescheduleBookingRequest): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.api}/admin/bookings/${id}`, request);
  }

  adminChangeStatus(id: number, status: BookingStatusCode, reasonCode?: string): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${this.api}/admin/bookings/${id}/status`, { status, reasonCode });
  }

  // customer-service: vehículo por placa, con el user_id de su dueño
  vehicleByPlate(plate: string): Observable<OwnedVehicleResponse[]> {
    return this.http.get<OwnedVehicleResponse[]>(`${this.api}/admin/vehicles`, { params: { plate } });
  }

  /* ---------- admin: catálogo ---------- */

  adminServices(): Observable<CatalogServiceResponse[]> {
    return this.http.get<CatalogServiceResponse[]>(`${this.api}/admin/catalog/services`);
  }

  createService(request: CatalogServiceRequest): Observable<CatalogServiceResponse> {
    return this.http.post<CatalogServiceResponse>(`${this.api}/admin/catalog/services`, request);
  }

  updateService(id: number, request: CatalogServiceRequest): Observable<CatalogServiceResponse> {
    return this.http.put<CatalogServiceResponse>(`${this.api}/admin/catalog/services/${id}`, request);
  }

  setServiceActive(id: number, active: boolean): Observable<CatalogServiceResponse> {
    return this.http.patch<CatalogServiceResponse>(`${this.api}/admin/catalog/services/${id}/status`, { active });
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/catalog/services/${id}`);
  }

  /* ---------- admin: horario y bahías ---------- */

  saveBusinessHours(week: BusinessHourDto[]): Observable<BusinessHourDto[]> {
    return this.http.put<BusinessHourDto[]>(`${this.api}/admin/schedule/business-hours`, week);
  }

  createException(request: HoursExceptionRequest): Observable<HoursExceptionResponse> {
    return this.http.post<HoursExceptionResponse>(`${this.api}/admin/schedule/exceptions`, request);
  }

  updateException(id: number, request: HoursExceptionRequest): Observable<HoursExceptionResponse> {
    return this.http.put<HoursExceptionResponse>(`${this.api}/admin/schedule/exceptions/${id}`, request);
  }

  deleteException(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/schedule/exceptions/${id}`);
  }

  bays(): Observable<BayResponse[]> {
    return this.http.get<BayResponse[]>(`${this.api}/admin/bays`);
  }

  createBay(name: string, status: BayStatusCode): Observable<BayResponse> {
    return this.http.post<BayResponse>(`${this.api}/admin/bays`, { name, status });
  }

  updateBay(id: number, name: string, status: BayStatusCode): Observable<BayResponse> {
    return this.http.put<BayResponse>(`${this.api}/admin/bays/${id}`, { name, status });
  }

  deleteBay(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/bays/${id}`);
  }
}

// horas libres que el backend propone cuando la pedida está ocupada (409 SLOT_UNAVAILABLE)
export function slotAlternatives(error: unknown): string[] | null {
  if (error instanceof HttpErrorResponse && error.status === 409) {
    const problem = error.error as SlotUnavailableProblem | null;
    if (problem?.code === 'SLOT_UNAVAILABLE') return problem.alternatives ?? [];
  }
  return null;
}
