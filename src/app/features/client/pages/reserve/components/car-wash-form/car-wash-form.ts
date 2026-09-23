import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
// iconos de Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle, VehiclesService } from '../../../../../../core/services/vehicles';
import {
  AvailabilitySlot,
  BookingServiceOption,
  BookingsService
} from '../../../../../../core/services/bookings';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  // vehículos registrados del cliente (GET /me/vehicles, los mismos de Mis Vehículos)
  vehicles: Vehicle[] = [];

  // catálogo con precio y duración para el tipo del vehículo elegido (GET /me/booking-options)
  services: BookingServiceOption[] = [];
  mostPopularService: string | null = null;

  // selección del usuario
  selectedVehicleId: number | null = null;
  selectedService: BookingServiceOption | null = null;
  date: string = '';
  time: string = '';
  address: string = '';

  // rango de fechas permitido
  minDate: string = '';
  maxDate: string = '';

  // franjas del día elegido (GET /availability) — el mock descarta horas pasadas y bahías llenas
  slots: AvailabilitySlot[] = [];
  dayClosed = false;
  dayClosedReason: string | null = null;

  submitting = false;
  errorKey: string | null = null;

  constructor(
    private vehiclesService: VehiclesService,
    private bookingsService: BookingsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDate = this.toDateInput(today);

    const max = new Date();
    max.setDate(today.getDate() + 60);
    this.maxDate = this.toDateInput(max);

    this.vehiclesService.myVehicles$().subscribe(vehicles => {
      this.vehicles = vehicles;
      this.cdr.markForCheck();
    });
  }

  selectVehicle(id: number) {
    if (this.selectedVehicleId === id) return;

    this.selectedVehicleId = id;
    this.selectedService = null;
    this.services = [];

    // el precio depende del tipo de vehículo, así que el catálogo se pide por vehículo
    this.bookingsService.options$(id).subscribe(options => {
      this.services = options.services;
      this.mostPopularService = options.mostPopular;
      this.cdr.markForCheck();
    });

    this.loadAvailability();
  }

  selectService(service: BookingServiceOption) {
    this.selectedService = service;
    // la duración cambia qué franjas caben antes del cierre
    this.loadAvailability();
  }

  onDateChange() {
    this.loadAvailability();
  }

  private loadAvailability() {
    this.time = '';
    this.slots = [];
    this.dayClosed = false;
    this.dayClosedReason = null;

    if (!this.date || !this.selectedService) return;

    this.bookingsService.availability$(this.date, this.selectedService.estimatedMinutes).subscribe(day => {
      this.slots = day.slots;
      this.dayClosed = !day.open;
      this.dayClosedReason = day.reason;
      this.cdr.markForCheck();
    });
  }

  get vehicle(): Vehicle | null {
    return this.vehicles.find(v => v.id === this.selectedVehicleId) ?? null;
  }

  get serviceTotal(): number {
    return this.selectedService?.price ?? 0;
  }

  get isFormValid(): boolean {
    return !!this.selectedVehicleId && !!this.selectedService && !!this.date && !!this.time && !!this.address.trim();
  }

  // ícono según el tipo de vehículo
  iconFor(type: string): string {
    if (type === 'MOTO') return 'two_wheeler';
    if (type === 'TRUCK' || type === 'PICKUP') return 'local_shipping';
    return 'directions_car';
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    if (!this.isFormValid || this.submitting || !this.selectedService) return;

    this.submitting = true;
    this.errorKey = null;

    this.bookingsService
      .create$({
        vehicleId: this.selectedVehicleId!,
        servicePriceIds: [this.selectedService.servicePriceId],
        date: this.date,
        time: this.time,
        serviceAddress: this.address.trim()
      })
      .subscribe({
        // la reserva queda pendiente de pago: se lleva al cliente a pagarla
        next: () => this.router.navigate(['/client/payment']),
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.errorKey = err.status === 409 ? 'RESERVE.ERROR_SLOT_TAKEN' : 'RESERVE.ERROR_GENERIC';
          if (err.status === 409) this.loadAvailability();
          this.cdr.markForCheck();
        }
      });
  }

  // yyyy-mm-dd en hora local (toISOString usaría UTC y en la noche saltaría al día siguiente)
  private toDateInput(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

}
