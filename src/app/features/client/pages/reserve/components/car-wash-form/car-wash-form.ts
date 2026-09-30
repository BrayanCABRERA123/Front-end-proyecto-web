import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// iconos de Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar el mensaje de reserva exitosa
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';
import { FeedbackService } from '../../../../../../shared/dialogs/feedback.service';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
// servicios reales: vehículos (customer-service) y catálogo/reservas (booking-service)
import { VehiclesService } from '../../../../../../core/services/vehicles';
import { VehicleResponse } from '../../../../../../core/models/vehicle.models';
import { BookingApiService, slotAlternatives } from '../../../../../../core/services/booking-api';
import {
  BookingResponse,
  CatalogServiceResponse,
  EstablishmentResponse,
} from '../../../../../../core/models/booking.models';
import { apiErrorKey } from '../../../../../../core/utils/api-error';

/**
 * Formulario de reserva del cliente. Todo lo que es regla sale del backend:
 * el precio y la duración dependen del tipo de vehículo (catalog.service_price), las horas
 * libres las calcula el booking-service (RF-006) y la reserva queda confirmada con bahía.
 */
@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  private readonly vehiclesService = inject(VehiclesService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // vehículos registrados del cliente (reales del backend)
  vehicles: VehicleResponse[] = [];
  vehiclesLoading = false;

  // servicios con el precio del tipo de vehículo elegido
  services: CatalogServiceResponse[] = [];
  servicesLoading = false;

  // selección del usuario
  selectedVehicleId: number | null = null;
  selectedServiceId: number | null = null;
  date = '';
  time = '';

  // horas que devuelve el backend para ese día (solo las libres se pueden escoger)
  availableTimes: string[] = [];
  dayClosed = false;
  timesLoading = false;

  // sede del lavadero (booking.establishment): el cliente lleva su vehículo allí
  location: EstablishmentResponse | null = null;

  submitting = false;

  // rango de fechas permitido (el backend también lo valida)
  minDate = '';
  maxDate = '';

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router,
    private feedback: FeedbackService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDate = this.isoDate(today);
    const max = new Date();
    max.setDate(today.getDate() + 60);
    this.maxDate = this.isoDate(max);

    this.loadVehicles();
    this.bookingApi.establishment().subscribe({
      next: (location) => { this.location = location; this.cdr.markForCheck(); },
      error: () => { this.location = null; }
    });
  }

  private loadVehicles(): void {
    this.vehiclesLoading = true;
    this.vehiclesService.list().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.vehiclesLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.vehicles = [];
        this.vehiclesLoading = false;
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }

  // al cambiar de vehículo cambian los precios: se piden los de su tipo
  selectVehicle(id: number) {
    this.selectedVehicleId = id;
    this.selectedServiceId = null;
    this.services = [];
    this.clearTimes();
    const vehicle = this.vehicle;
    if (!vehicle) return;

    this.servicesLoading = true;
    this.bookingApi.services(vehicle.vehicleTypeId).subscribe({
      next: (services) => {
        this.services = services;
        this.servicesLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.servicesLoading = false;
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }

  selectService(id: number) {
    this.selectedServiceId = id;
    this.loadTimes();
  }

  onDateChange(): void {
    this.loadTimes();
  }

  // horas libres del día para ese servicio y ese tipo de vehículo
  private loadTimes(): void {
    this.clearTimes();
    const vehicle = this.vehicle;
    if (!vehicle || !this.selectedServiceId || !this.date) return;

    this.timesLoading = true;
    this.bookingApi.availability(this.date, vehicle.vehicleTypeId, [this.selectedServiceId]).subscribe({
      next: (availability) => {
        this.dayClosed = !availability.open;
        this.availableTimes = availability.slots.filter(slot => slot.available).map(slot => slot.time);
        this.timesLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.timesLoading = false;
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
        this.cdr.markForCheck();
      }
    });
  }

  private clearTimes(): void {
    this.time = '';
    this.availableTimes = [];
    this.dayClosed = false;
  }

  get vehicle(): VehicleResponse | null {
    return this.vehicles.find(v => v.id === this.selectedVehicleId) ?? null;
  }

  get service(): CatalogServiceResponse | null {
    return this.services.find(s => s.id === this.selectedServiceId) ?? null;
  }

  // precio y duración del servicio para el tipo del vehículo (vienen del backend)
  priceOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.price ?? 0;
  }

  minutesOf(service: CatalogServiceResponse): number {
    return service.prices[0]?.estimatedMinutes ?? 0;
  }

  get serviceTotal(): number {
    return this.service ? this.priceOf(this.service) : 0;
  }

  get isFormValid(): boolean {
    return !!this.selectedVehicleId && !!this.selectedServiceId && !!this.date && !!this.time && !this.submitting;
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    if (!this.isFormValid || !this.selectedVehicleId || !this.selectedServiceId) return;

    this.submitting = true;
    this.bookingApi.createBooking({
      vehicleId: this.selectedVehicleId,
      serviceIds: [this.selectedServiceId],
      date: this.date,
      time: this.time
    }).subscribe({
      next: (booking) => {
        this.submitting = false;
        this.showReservationSuccess(booking);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.submitting = false;
        const alternatives = slotAlternatives(error);
        if (alternatives) {
          // RF-006: la hora se ocupó; se muestran las horas libres que propone el backend
          this.time = '';
          this.availableTimes = alternatives;
          this.feedback.error('RESERVE.SLOT_TAKEN_TITLE', 'RESERVE.SLOT_TAKEN_MESSAGE');
        } else {
          this.feedback.error('COMMON.ERROR', apiErrorKey(error));
        }
        this.cdr.markForCheck();
      }
    });
  }

  // muestra el modal de reserva exitosa con lo que guardó el backend y, al cerrarlo, lleva al pago
  private showReservationSuccess(booking: BookingResponse): void {
    const vehicle = booking.vehicle;

    const data: StatusModalData = {
      title: 'RESERVE.SUCCESS_TITLE',
      message: 'RESERVE.SUCCESS_MESSAGE',
      buttonText: 'RESERVE.SUCCESS_BUTTON',
      details: [
        { label: 'RESERVE.SUMMARY.CODE', value: booking.code },
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${vehicle?.brand ?? ''} ${vehicle?.model ?? ''}`.trim() },
        { label: 'RESERVE.SUMMARY.PLATE', value: vehicle?.licensePlateFormatted ?? '' },
        { label: 'RESERVE.SUMMARY.SERVICE', value: booking.services.map(s => s.name).join(', ') },
        { label: 'RESERVE.SUMMARY.DATE', value: booking.date },
        { label: 'RESERVE.SUMMARY.TIME', value: `${booking.startTime} - ${booking.endTime}` },
        { label: 'RESERVE.SUMMARY.BAY', value: booking.bay?.name ?? '' },
        { label: 'RESERVE.SUMMARY.LOCATION', value: this.location?.address ?? '' },
        { label: 'RESERVE.SUMMARY.TOTAL', value: new CopPricePipe().transform(booking.total) }
      ]
    };

    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // evita que se cierre al hacer clic afuera o con ESC, así el usuario
      // siempre pasa por el botón y se garantiza la redirección al pago
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe(() => {
      // el siguiente paso del flujo es pagar la reserva
      this.router.navigate(['/client/payment']);
    });
  }

  private isoDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
