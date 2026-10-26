import { Injectable, computed, inject, signal } from '@angular/core';

import { VehiclesService } from '../../../core/services/vehicles';
import { VehicleResponse } from '../../../core/models/vehicle.models';
import { BookingApiService, slotAlternatives, slotTakenByOthers } from '../../../core/services/booking-api';
import { BookingPaymentMode, BookingResponse, CatalogServiceResponse, EstablishmentResponse } from '../../../core/models/booking.models';
import { AvailableOperatorResponse, OperationsApiService, localIsoDate } from '../../../core/services/operations-api';
import { apiErrorKey } from '../../../core/utils/api-error';
// cuentas activas del lavadero (las mismas que usa la pantalla de pago): dicen si hay efectivo
import { PaymentsApiService } from '../../../core/services/payments-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

// precio y duración del servicio para el tipo del vehículo (vienen del backend)
export function priceOf(service: CatalogServiceResponse): number {
  return service.prices[0]?.price ?? 0;
}

export function minutesOf(service: CatalogServiceResponse): number {
  return service.prices[0]?.estimatedMinutes ?? 0;
}

/**
 * Reserva del cliente. Todo lo que es regla sale del backend: el precio y la duración dependen
 * del tipo de vehículo (catalog.service_price), las horas libres las calcula booking-service
 * (RF-006), los operarios libres operations-service (RF-010) y la reserva queda con bahía.
 */
@Injectable()
export class ReserveViewModel {

  private readonly vehiclesService = inject(VehiclesService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly feedback = inject(FeedbackService);

  // vehículos registrados del cliente
  readonly vehicles = signal<VehicleResponse[]>([]);
  readonly vehiclesLoading = signal(false);

  // servicios con el precio del tipo de vehículo elegido
  readonly services = signal<CatalogServiceResponse[]>([]);
  readonly servicesLoading = signal(false);

  // selección del usuario
  readonly selectedVehicleId = signal<number | null>(null);
  readonly selectedServiceId = signal<number | null>(null);
  readonly date = signal('');
  readonly time = signal('');

  // horas que devuelve el backend para ese día (solo las libres se pueden escoger)
  readonly availableTimes = signal<string[]>([]);
  readonly dayClosed = signal(false);
  readonly timesLoading = signal(false);

  // RF-010: operarios libres a esa hora; null = sin preferencia (el sistema asigna uno, RF-008)
  readonly operators = signal<AvailableOperatorResponse[]>([]);
  readonly operatorsLoading = signal(false);
  readonly preferredOperatorId = signal<number | null>(null);

  // sede del lavadero: el cliente lleva su vehículo allí
  readonly location = signal<EstablishmentResponse | null>(null);
  readonly submitting = signal(false);

  // paso "¿Cómo vas a pagar?": por defecto el pago digital (QR + comprobante, con plazo)
  readonly paymentMode = signal<BookingPaymentMode>('DIGITAL');
  // el efectivo solo se ofrece si el admin tiene activa la cuenta de caja (EFECTIVO)
  readonly cashAvailable = signal(false);

  // rango de fechas permitido (el backend también lo valida): hoy y los próximos 60 días
  readonly minDate = localIsoDate(new Date());
  readonly maxDate = localIsoDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));

  readonly vehicle = computed(() => this.vehicles().find(v => v.id === this.selectedVehicleId()) ?? null);
  readonly service = computed(() => this.services().find(s => s.id === this.selectedServiceId()) ?? null);
  readonly serviceTotal = computed(() => { const service = this.service(); return service ? priceOf(service) : 0; });

  readonly isFormValid = computed(() => !!this.selectedVehicleId() && !!this.selectedServiceId()
    && !!this.date() && !!this.time() && !this.submitting());

  load(): void {
    this.vehiclesLoading.set(true);
    this.vehiclesService.list().subscribe({
      next: vehicles => {
        this.vehicles.set(vehicles);
        this.vehiclesLoading.set(false);
      },
      error: (error: unknown) => {
        this.vehicles.set([]);
        this.vehiclesLoading.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      }
    });
    this.bookingApi.establishment().subscribe({
      next: location => this.location.set(location),
      error: () => this.location.set(null)
    });
    this.loadPaymentOptions();
  }

  selectPaymentMode(mode: BookingPaymentMode): void {
    if (mode === 'CASH' && !this.cashAvailable()) return;
    this.paymentMode.set(mode);
  }

  // al cambiar de vehículo cambian los precios: se piden los de su tipo
  selectVehicle(id: number): void {
    this.selectedVehicleId.set(id);
    this.selectedServiceId.set(null);
    this.services.set([]);
    this.clearTimes();
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.servicesLoading.set(true);
    this.bookingApi.services(vehicle.vehicleTypeId).subscribe({
      next: services => {
        this.services.set(services);
        this.servicesLoading.set(false);
      },
      error: (error: unknown) => {
        this.servicesLoading.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      }
    });
  }

  selectService(id: number): void {
    this.selectedServiceId.set(id);
    this.loadTimes();
  }

  onDateChange(): void {
    this.loadTimes();
  }

  // al escoger la hora: quién está libre en ese horario
  onTimeChange(): void {
    this.clearOperators();
    const service = this.service();
    if (!this.time() || !this.date() || !service) return;
    this.operatorsLoading.set(true);
    this.operationsApi.availableOperators(this.date(), this.time(), minutesOf(service)).subscribe({
      next: operators => {
        this.operators.set(operators);
        this.operatorsLoading.set(false);
      },
      // sin la lista se reserva igual, sin preferencia
      error: () => this.operatorsLoading.set(false)
    });
  }

  /** crea la reserva; si la hora ya no sirve, ofrece las horas libres que propone el backend */
  submit(created: (booking: BookingResponse) => void): void {
    const vehicleId = this.selectedVehicleId();
    const serviceId = this.selectedServiceId();
    if (!this.isFormValid() || !vehicleId || !serviceId) return;

    this.submitting.set(true);
    this.bookingApi.createBooking({
      vehicleId,
      serviceIds: [serviceId],
      date: this.date(),
      time: this.time(),
      preferredOperatorId: this.preferredOperatorId(),
      paymentMode: this.paymentMode()
    }).subscribe({
      next: booking => {
        this.submitting.set(false);
        created(booking);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const alternatives = slotAlternatives(error);
        if (!alternatives) {
          this.feedback.error('COMMON.ERROR', apiErrorKey(error));
          return;
        }
        // RF-006: la hora no sirve; se muestran las horas libres que propone el backend y el motivo
        this.time.set('');
        this.availableTimes.set(alternatives);
        if (slotTakenByOthers(error)) {
          this.feedback.error('RESERVE.SLOT_TAKEN_TITLE', 'RESERVE.SLOT_TAKEN_MESSAGE');
        } else {
          this.feedback.error('RESERVE.SLOT_NOT_BOOKABLE_TITLE', apiErrorKey(error));
        }
      }
    });
  }

  // sin respuesta de payment-service no se ofrece el efectivo: queda el pago digital
  private loadPaymentOptions(): void {
    this.paymentsApi.accounts().subscribe({
      next: accounts => {
        const cash = accounts.some(account => account.methodCode === 'EFECTIVO');
        this.cashAvailable.set(cash);
        if (!cash) this.paymentMode.set('DIGITAL');
      },
      error: () => {
        this.cashAvailable.set(false);
        this.paymentMode.set('DIGITAL');
      }
    });
  }

  // horas libres del día para ese servicio y ese tipo de vehículo
  private loadTimes(): void {
    this.clearTimes();
    const vehicle = this.vehicle();
    const serviceId = this.selectedServiceId();
    if (!vehicle || !serviceId || !this.date()) return;

    this.timesLoading.set(true);
    this.bookingApi.availability(this.date(), vehicle.vehicleTypeId, [serviceId]).subscribe({
      next: availability => {
        this.dayClosed.set(!availability.open);
        this.availableTimes.set(availability.slots.filter(slot => slot.available).map(slot => slot.time));
        this.timesLoading.set(false);
      },
      error: (error: unknown) => {
        this.timesLoading.set(false);
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
      }
    });
  }

  private clearTimes(): void {
    this.time.set('');
    this.availableTimes.set([]);
    this.dayClosed.set(false);
    this.clearOperators();
  }

  private clearOperators(): void {
    this.operators.set([]);
    this.preferredOperatorId.set(null);
  }
}
