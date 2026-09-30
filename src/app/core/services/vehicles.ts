import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api';
import { VehicleRequest, VehicleResponse, VehicleTypeResponse } from '../models/vehicle.models';

// vehículos del cliente y catálogo de tipos contra el customer-service.
// el id del cliente nunca viaja en el cuerpo: sale del token JWT en el servidor.
@Injectable({
  providedIn: 'root',
})
export class VehiclesService {

  private readonly http = inject(HttpClient);

  // vehículos del cliente que tiene la sesión abierta
  list(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${API_BASE_URL}/vehicles`);
  }

  // registra un vehículo nuevo
  register(request: VehicleRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(`${API_BASE_URL}/vehicles`, request);
  }

  // actualiza un vehículo existente (PUT completo: llegan siempre los cuatro campos)
  update(id: number, request: VehicleRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${API_BASE_URL}/vehicles/${id}`, request);
  }

  // elimina un vehículo (borrado lógico: el backend responde 204 sin cuerpo)
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/vehicles/${id}`);
  }

  // catálogo público de tipos de vehículo, lo usa el formulario
  listVehicleTypes(): Observable<VehicleTypeResponse[]> {
    return this.http.get<VehicleTypeResponse[]>(`${API_BASE_URL}/vehicle-types`);
  }
}