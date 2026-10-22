import { Injectable, computed, inject, signal } from '@angular/core';

import { Booking } from '../models/admin.models';
import { BookingApiService, slotAlternatives, slotTakenByOthers } from '../../../core/services/booking-api';
import { ReservationsStore } from '../services/reservations-store';
import { CatalogServiceResponse, OwnedVehicleResponse } from '../../../core/models/booking.models';
import { apiErrorKey } from '../../../core/utils/api-error';
import { isoDaysFromToday, todayIso } from '../../../core/utils/dates';

// cuerpo que se manda al booking-service (vehicleId se ignora al reprogramar)
export interface BookingModalResult {
  vehicleId: number;
  serviceIds: number[];
  date: string;
  time: string;
  notes: string;
}

/**
 * Nueva reserva o reprogramación desde el admin. Nada se calcula aquí:
 * - el vehículo y su dueño se buscan por placa en customer-service;
 * - los servicios traen el precio y la duración del tipo de ese vehículo;
 * - las horas son las libres que devuelve el booking-service;
 * - la bahía la asigna el backend al guardar.
 */
@Injectable()
export class BookingFormViewModel {

  private readonly api = inject(BookingApiService);
  private readonly store = inject(ReservationsStore);

  readonly saving = signal(false);
  readonly saveErrorKey = signal<string | null>(null);

  readonly editing = signal(false);
  private bookingId: number | null = null;

  readonly plate = signal('');
  readonly searching = signal(false);
  readonly searchErrorKey = signal<string | null>(null);
  readonly vehicle = signal<OwnedVehicleResponse['vehicle'] | null>(null);

  readonly services = signal<CatalogServiceResponse[]>([]);
  readonly selectedServiceIds = signal(new Set<number>());

  // rango que acepta booking-service: de hoy a 60 días
  readonly minDate = todayIso();
  readonly maxDate = isoDaysFromToday(60);

  readonly date = signal(this.minDate);
  readonly time = signal('');
  readonly times = signal<string[]>([]);
  readonly timesLoading = signal(false);
  readonly dayClosed = signal(false);
  readonly notes = signal('');

  readonly dateInRange = computed(() => !!this.date() && this.date() >= this.minDate && this.date() <= this.maxDate);
  readonly canSave = computed(() => !!this.vehicle() && this.selectedServiceIds().size > 0 && this.dateInRange() && !!this.time());

  /** reprogramar: mismo vehículo; se proponen la fecha y los servicios que tenía */
  init(booking?: Booking): void {
    if (!booking) return;
    this.editing.set(true);
    this.bookingId = Number(booking.id);
    this.plate.set(booking.plate);
    // una reserva de un día ya pasado se reprograma desde hoy
    this.date.set(booking.date < this.minDate ? this.minDate : booking.date);
    this.notes.set(booking.notes);
    this.selectedServiceIds.set(new Set(booking.serviceIds));
    this.searchVehicle();
  }

  /** busca el vehículo por placa (customer-service) y carga los precios de su tipo */
  searchVehicle(): void {
    const plate = this.plate().trim();
    if (!plate) return;
    this.searching.set(true);
    this.searchErrorKey.set(null);
    this.vehicle.set(null);
    this.services.set([]);
    this.api.vehicleByPlate(plate).subscribe({
      next: found => {
        this.searching.set(false);
        if (!found.length) {
          this.searchErrorKey.set('BOOKING_MODAL.VEHICLE_NOT_FOUND');
        } else {
          this.vehicle.set(found[0].vehicle);
          this.loadServices();
        }
      },
      error: (error: unknown) => {
        this.searching.set(false);
        this.searchErrorKey.set(apiErrorKey(error));
      }
    });
  }

  // precios del tipo de ese vehículo; quita los servicios que ya no se ofrecen para ese tipo
  private loadServices(): void {
    const vehicle = this.vehicle();
    if (!vehicle) return;
    this.api.services(vehicle.vehicleTypeId).subscribe({
      next: services => {
        this.services.set(services);
        const available = new Set(services.map(s => s.id));
        this.selectedServiceIds.update(ids => new Set([...ids].filter(id => available.has(id))));
        this.loadTimes();
      },
      error: (error: unknown) => this.searchErrorKey.set(apiErrorKey(error))
    });
  }

  toggleService(id: number): void {
    this.selectedServiceIds.update(ids => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    this.loadTimes();
  }

  onDateChange(): void {
    this.loadTimes();
  }

  /** horas libres del día (el backend excluye esta misma reserva al reprogramar) */
  loadTimes(): void {
    this.time.set('');
    this.times.set([]);
    this.dayClosed.set(false);
    const vehicle = this.vehicle();
    const serviceIds = [...this.selectedServiceIds()];
    if (!vehicle || !serviceIds.length || !this.date()) return;

    this.timesLoading.set(true);
    this.api.availability(this.date(), vehicle.vehicleTypeId, serviceIds, this.bookingId ?? undefined).subscribe({
      next: availability => {
        this.dayClosed.set(!availability.open);
        this.times.set(availability.slots.filter(slot => slot.available).map(slot => slot.time));
        this.timesLoading.set(false);
      },
      error: (error: unknown) => {
        this.timesLoading.set(false);
        this.searchErrorKey.set(apiErrorKey(error));
      }
    });
  }

  /** guarda en el backend; `saved` recibe la reserva ya confirmada (y su bahía) */
  save(saved: (booking: Booking) => void): void {
    const vehicle = this.vehicle();
    if (!this.canSave() || !vehicle || this.saving()) return;
    const result: BookingModalResult = {
      vehicleId: vehicle.id,
      serviceIds: [...this.selectedServiceIds()],
      date: this.date(),
      time: this.time(),
      notes: this.notes().trim(),
    };
    this.saving.set(true);
    this.saveErrorKey.set(null);
    const request$ = this.bookingId !== null
      ? this.store.reschedule(String(this.bookingId), result)
      : this.store.create(result);
    request$.subscribe({
      next: saved,
      error: (error: unknown) => {
        this.saving.set(false);
        const alternatives = slotAlternatives(error);
        if (alternatives) {
          // RF-006: la hora escogida se ocupó; se ofrecen las que propuso el backend
          this.time.set('');
          this.times.set(alternatives);
          this.saveErrorKey.set(slotTakenByOthers(error) ? 'RESERVE.SLOT_TAKEN_MESSAGE' : apiErrorKey(error));
        } else {
          this.saveErrorKey.set(apiErrorKey(error));
        }
      }
    });
  }

  priceOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.price ?? 0;
  }

  minutesOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.estimatedMinutes ?? 0;
  }

  // la placa se escribe en mayúsculas
  setPlate(value: string): void {
    this.plate.set(value.toUpperCase());
  }

  // placa escrita (para habilitar "Buscar")
  hasPlate(): boolean {
    return !!this.plate().trim();
  }
}
