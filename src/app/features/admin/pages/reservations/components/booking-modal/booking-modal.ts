import { ChangeDetectorRef, Component, Inject, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Booking } from '../../../../models/admin.models';
import { BookingApiService, slotAlternatives } from '../../../../../../core/services/booking-api';
import { ReservationsStore } from '../../../../services/reservations-store';
import { CatalogServiceResponse, OwnedVehicleResponse } from '../../../../../../core/models/booking.models';
import { apiErrorKey } from '../../../../../../core/utils/api-error';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';

// presente cuando se reprograma una reserva existente
export interface BookingModalData {
  booking?: Booking;
}

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
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.scss',
})
export class BookingModal {

  private readonly api = inject(BookingApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly store = inject(ReservationsStore);

  saving = false;
  saveErrorKey: string | null = null;

  editing = false;
  private bookingId: number | null = null;

  plate = '';
  searching = false;
  searchErrorKey: string | null = null;
  vehicle: OwnedVehicleResponse['vehicle'] | null = null;

  services: CatalogServiceResponse[] = [];
  selectedServiceIds = new Set<number>();

  date = '';
  time = '';
  times: string[] = [];
  timesLoading = false;
  dayClosed = false;

  notes = '';

  constructor(
    private dialogRef: MatDialogRef<BookingModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: BookingModalData | null,
  ) {
    const booking = data?.booking;
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    this.date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    if (booking) {
      // reprogramar: mismo vehículo; se proponen la fecha y los servicios que tenía
      this.editing = true;
      this.bookingId = Number(booking.id);
      this.plate = booking.plate;
      this.date = booking.date;
      this.notes = booking.notes;
      booking.serviceIds.forEach(id => this.selectedServiceIds.add(id));
      this.searchVehicle();
    }
  }

  /** busca el vehículo por placa (customer-service) y carga los precios de su tipo */
  searchVehicle(): void {
    const plate = this.plate.trim();
    if (!plate) return;
    this.searching = true;
    this.searchErrorKey = null;
    this.vehicle = null;
    this.services = [];
    this.api.vehicleByPlate(plate).subscribe({
      next: (found) => {
        this.searching = false;
        if (!found.length) {
          this.searchErrorKey = 'BOOKING_MODAL.VEHICLE_NOT_FOUND';
        } else {
          this.vehicle = found[0].vehicle;
          this.loadServices();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.searching = false;
        this.searchErrorKey = apiErrorKey(error);
        this.cdr.markForCheck();
      }
    });
  }

  private loadServices(): void {
    if (!this.vehicle) return;
    this.api.services(this.vehicle.vehicleTypeId).subscribe({
      next: (services) => {
        this.services = services;
        // quita los que ya no se ofrecen para este tipo de vehículo
        const available = new Set(services.map(s => s.id));
        [...this.selectedServiceIds].filter(id => !available.has(id)).forEach(id => this.selectedServiceIds.delete(id));
        this.loadTimes();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.searchErrorKey = apiErrorKey(error);
        this.cdr.markForCheck();
      }
    });
  }

  toggleService(id: number): void {
    if (this.selectedServiceIds.has(id)) {
      this.selectedServiceIds.delete(id);
    } else {
      this.selectedServiceIds.add(id);
    }
    this.loadTimes();
  }

  onDateChange(): void {
    this.loadTimes();
  }

  /** horas libres del día (el backend excluye esta misma reserva al reprogramar) */
  loadTimes(): void {
    this.time = '';
    this.times = [];
    this.dayClosed = false;
    if (!this.vehicle || !this.selectedServiceIds.size || !this.date) return;

    this.timesLoading = true;
    this.api.availability(this.date, this.vehicle.vehicleTypeId, [...this.selectedServiceIds], this.bookingId ?? undefined)
      .subscribe({
        next: (availability) => {
          this.dayClosed = !availability.open;
          this.times = availability.slots.filter(slot => slot.available).map(slot => slot.time);
          this.timesLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.timesLoading = false;
          this.searchErrorKey = apiErrorKey(error);
          this.cdr.markForCheck();
        }
      });
  }

  /** muestra las horas que propuso el backend cuando la escogida se ocupó (RF-006) */
  showAlternatives(alternatives: string[]): void {
    this.time = '';
    this.times = alternatives;
  }

  priceOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.price ?? 0;
  }

  minutesOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.estimatedMinutes ?? 0;
  }

  get canSave(): boolean {
    return !!this.vehicle && this.selectedServiceIds.size > 0 && !!this.date && !!this.time;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  /** guarda en el backend; se cierra con la reserva ya confirmada (y su bahía) */
  save(): void {
    if (!this.canSave || !this.vehicle || this.saving) return;
    const result: BookingModalResult = {
      vehicleId: this.vehicle.id,
      serviceIds: [...this.selectedServiceIds],
      date: this.date,
      time: this.time,
      notes: this.notes.trim(),
    };
    this.saving = true;
    this.saveErrorKey = null;
    const request$ = this.bookingId !== null
      ? this.store.reschedule(String(this.bookingId), result)
      : this.store.create(result);
    request$.subscribe({
      next: (booking) => this.dialogRef.close(booking),
      error: (error) => {
        this.saving = false;
        const alternatives = slotAlternatives(error);
        if (alternatives) {
          this.showAlternatives(alternatives);
          this.saveErrorKey = 'RESERVE.SLOT_TAKEN_MESSAGE';
        } else {
          this.saveErrorKey = apiErrorKey(error);
        }
        this.cdr.markForCheck();
      }
    });
  }
}
