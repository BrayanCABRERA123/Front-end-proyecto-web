import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from './api';

// Modelo único de vehículo — reemplaza los 3 shapes distintos que existían en
// client/dashboard, client/vehicles y reserve/car-wash-form.
export interface Vehicle {
  id: number;
  type: string; // código de vehicleType: CAR/SEDAN/SUV/PICKUP/TRUCK/MOTO
  brand: string | null;
  model: string | null;
  plate: string;
  color: string | null;
  lastWash: string | null; // fecha del último lavado completado, ya formateada
  lastWashAt: string | null; // la misma fecha en ISO, para comparar
  service: string | null; // código del último servicio (BASIC/FULL/PREMIUM)
  totalWashes: number;
}

export interface NewVehicle {
  licensePlate: string;
  vehicleTypeId: number;
  brand?: string;
  model?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  constructor(private api: Api) {}

  myVehicles$(): Observable<Vehicle[]> {
    return this.api.get<Vehicle[]>('me/vehicles');
  }

  create$(vehicle: NewVehicle): Observable<Vehicle> {
    return this.api.post<Vehicle>('me/vehicles', vehicle);
  }

  remove$(id: number): Observable<void> {
    return this.api.delete<void>(`me/vehicles/${id}`);
  }
}
