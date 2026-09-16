import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reserva } from '../../shared/dialogs/reservation-models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getReservationsByOperator(operatorId: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.baseUrl}/reservations?operatorId=${operatorId}`);
  }

  getVehiclesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vehicles?userId=${userId}`);
  }

  addVehicle(vehicle: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/vehicles`, vehicle);
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/vehicles/${id}`);
  }
}
