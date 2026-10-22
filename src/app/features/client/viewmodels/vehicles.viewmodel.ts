import { Injectable, computed, inject, signal } from '@angular/core';

// vehículos del cliente (customer-service) y sus reservas (booking-service)
import { VehiclesService } from '../../../core/services/vehicles';
import { VehicleRequest, VehicleResponse } from '../../../core/models/vehicle.models';
import { BookingApiService } from '../../../core/services/booking-api';
import { isFinishedStatus, isoToDisplayDate } from '../../../core/utils/booking-display';
import { apiErrorKey } from '../../../core/utils/api-error';
import { VehicleFormValue, normalizePlate } from '../../../shared/dialogs/register-vehicle-modal/vehicle.model';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

// lo único que necesita la tarjeta de cada vehículo, armado desde la respuesta del backend
export interface VehicleCard {
  id: number;
  type: string;   // código del tipo, p. ej. SEDAN
  brand: string;
  model: string;
  plate: string;  // placa con guion para mostrar (ABC-123)
  color: string;
}

/** Mis vehículos: la lista, registrar, editar y eliminar, y los lavados terminados. */
@Injectable()
export class ClientVehiclesViewModel {

  private readonly vehiclesService = inject(VehiclesService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly feedback = inject(FeedbackService);

  readonly vehicles = signal<VehicleCard[]>([]);
  readonly totalVehicles = computed(() => this.vehicles().length);

  // lavados terminados (reservas COMPLETED) y la fecha del más reciente (dd/mm/aaaa)
  readonly totalWashes = signal(0);
  readonly lastWashOverall = signal('—');

  load(): void {
    this.reload();
    this.loadWashes();
  }

  // pide los vehículos al backend y los deja listos para la pantalla
  reload(): void {
    this.vehiclesService.list().subscribe({
      next: list => this.vehicles.set(list.map(toCard)),
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  register(vehicle: VehicleFormValue): void {
    this.vehiclesService.register(toRequest(vehicle)).subscribe({
      next: () => {
        this.reload();
        this.feedback.success('VEHICLES.SUCCESS.CREATED_TITLE', 'VEHICLES.SUCCESS.CREATED_MESSAGE');
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  update(id: number, vehicle: VehicleFormValue): void {
    this.vehiclesService.update(id, toRequest(vehicle)).subscribe({
      next: () => {
        this.reload();
        this.feedback.success('VEHICLES.SUCCESS.UPDATED_TITLE', 'VEHICLES.SUCCESS.UPDATED_MESSAGE');
      },
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  // elimina el vehículo en el backend y vuelve a pedir la lista
  remove(id: number): void {
    this.vehiclesService.remove(id).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => this.feedback.error('COMMON.ERROR', apiErrorKey(error))
    });
  }

  find(id: number): VehicleCard | undefined {
    return this.vehicles().find(v => v.id === id);
  }

  // cuenta las reservas terminadas; si booking-service no responde se queda en 0 y "—"
  private loadWashes(): void {
    this.bookingApi.myBookings().subscribe({
      next: bookings => {
        const washes = bookings.filter(booking => isFinishedStatus(booking.status));
        this.totalWashes.set(washes.length);
        // las fechas llegan como aaaa-mm-dd, así que ordenarlas como texto las ordena por fecha
        const last = washes.map(booking => booking.date).sort().pop();
        this.lastWashOverall.set(last ? isoToDisplayDate(last) : '—');
      },
      error: () => undefined
    });
  }
}

// convierte la respuesta del backend en lo que usa la tarjeta
function toCard(vehicle: VehicleResponse): VehicleCard {
  return {
    id: vehicle.id,
    type: vehicle.vehicleType,
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.licensePlateFormatted,
    color: vehicle.color
  };
}

// convierte el formulario del modal en el cuerpo que espera POST/PUT
function toRequest(vehicle: VehicleFormValue): VehicleRequest {
  return {
    licensePlate: normalizePlate(vehicle.plate),
    vehicleType: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color
  };
}
