import { Injectable, computed, inject, signal } from '@angular/core';

import { BookingApiService } from '../../../core/services/booking-api';
import { BookingResponse, EstablishmentResponse } from '../../../core/models/booking.models';
import { isActiveStatus, isFinishedStatus, isoToDisplayDate, servicesLabel, vehicleLabel } from '../../../core/utils/booking-display';
import { VehiclesService } from '../../../core/services/vehicles';
import { UserSession } from '../../../core/services/user-session';
import { LoyaltyApiService, PromotionForCustomer } from '../../../core/services/loyalty-api';
import { OperationsApiService, localIsoDate } from '../../../core/services/operations-api';
import { discountLabel } from '../../../core/services/promotions-api';

// avance de la barra según el estado de la reserva
const PROGRESS_BY_STATUS: Record<string, number> = {
  SCHEDULED: 0,
  CONFIRMED: 0,
  IN_PROGRESS: 50,
  COMPLETED: 100
};

export interface NextService {
  id: number;
  serviceName: string;
  vehicle: string;
  plate: string;
  date: string;
  operator: string;
  status: string;
}

export interface Benefit {
  title: string;
  unlocked: boolean;
  // puntos que le faltan para desbloquearlo
  pointsLeft: number;
}

export interface LoyaltyProgress {
  current: number;
  goal: number;
  percentage: number;
  allUnlocked?: boolean;
  // el admin no ha creado promociones (o no cargaron): solo se muestran los puntos, sin meta
  noPromotions?: boolean;
}

/** Inicio del cliente: contadores, próximo servicio, sede, beneficios y avance de puntos. */
@Injectable()
export class ClientDashboardViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly vehiclesService = inject(VehiclesService);
  private readonly loyaltyApi = inject(LoyaltyApiService);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly session = inject(UserSession);

  readonly userName = computed(() => this.session.user().name);

  private readonly vehicleCount = signal(0);
  private readonly activeCount = signal(0);
  private readonly washesDone = signal(0);

  readonly stats = computed(() => [
    { icon: 'calendar_today', value: this.activeCount(), label: 'STATS.ACTIVE_RESERVATIONS' },
    { icon: 'directions_car', value: this.vehicleCount(), label: 'STATS.MY_VEHICLES' },
    { icon: 'water_drop', value: this.washesDone(), label: 'STATS.WASHES_DONE' }
  ]);

  readonly nextService = signal<NextService | null>(null);
  readonly nextServiceProgress = computed(() => PROGRESS_BY_STATUS[this.nextService()?.status ?? ''] ?? 0);
  readonly location = signal<EstablishmentResponse | null>(null);
  readonly benefits = signal<Benefit[]>([]);
  readonly loyalty = signal<LoyaltyProgress | null>(null);

  load(): void {
    this.vehiclesService.list().subscribe({
      next: vehicles => this.vehicleCount.set(vehicles.length),
      // si no hay perfil o hay error, queda en 0
      error: () => this.vehicleCount.set(0)
    });
    this.loadBookings();
    this.loadLoyalty();
    this.bookingApi.establishment().subscribe({
      next: location => this.location.set(location),
      error: () => this.location.set(null)
    });
  }

  // reservas reales del cliente: alimentan los contadores y el "próximo servicio"
  private loadBookings(): void {
    this.bookingApi.myBookings().subscribe({
      next: bookings => this.applyBookings(bookings),
      // sin reservas (o backend caído) los contadores quedan en 0 y no hay próximo servicio
      error: () => this.nextService.set(null)
    });
  }

  private applyBookings(bookings: BookingResponse[]): void {
    const active = bookings.filter(booking => isActiveStatus(booking.status));
    this.activeCount.set(active.length);
    this.washesDone.set(bookings.filter(booking => isFinishedStatus(booking.status)).length);

    // la próxima: la reserva activa con fecha y hora más cercanas desde hoy
    const today = localIsoDate(new Date());
    const next = active
      .filter(booking => booking.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];

    this.nextService.set(next ? {
      id: next.id,
      serviceName: servicesLabel(next),
      vehicle: vehicleLabel(next.vehicle),
      plate: next.vehicle?.licensePlateFormatted ?? '',
      date: `${isoToDisplayDate(next.date)} · ${next.startTime} - ${next.endTime}`,
      operator: '',
      status: next.status
    } : null);

    if (next) this.loadOperator(next.id);
  }

  // operario asignado a la próxima reserva (operations-service); vacío si aún no hay
  private loadOperator(bookingId: number): void {
    this.operationsApi.myBookingOperators().subscribe({
      next: assigned => {
        const operator = assigned.find(item => item.bookingId === bookingId)?.operatorName ?? '';
        this.nextService.update(service => service ? { ...service, operator } : service);
      },
      error: () => undefined
    });
  }

  // puntos y promociones de fidelización (payment-service)
  private loadLoyalty(): void {
    this.loyaltyApi.balance().subscribe({
      next: balance => {
        this.loyaltyApi.promotions().subscribe({
          next: promotions => this.applyLoyalty(balance.points, promotions),
          error: () => this.loyalty.set({ current: balance.points, goal: 0, percentage: 0, noPromotions: true })
        });
      },
      error: () => {
        this.loyalty.set(null);
        this.benefits.set([]);
      }
    });
  }

  private applyLoyalty(points: number, promotions: PromotionForCustomer[]): void {
    const next = promotions.filter(p => !p.unlocked).sort((a, b) => a.requiredPoints - b.requiredPoints)[0];
    if (promotions.length === 0) {
      // sin promociones no hay nada que desbloquear: no se dice "las desbloqueaste todas"
      this.loyalty.set({ current: points, goal: 0, percentage: 0, noPromotions: true });
    } else if (next) {
      this.loyalty.set({ current: points, goal: next.requiredPoints, percentage: Math.min(100, Math.round((points / Math.max(next.requiredPoints, 1)) * 100)) });
    } else {
      this.loyalty.set({ current: points, goal: points, percentage: 100, allUnlocked: true });
    }

    this.benefits.set(promotions.map(p => ({
      // un descuento fijo se muestra en pesos, no como "0 %"
      title: (p.discountType === 'FIXED' ? (p.discountValue ?? 0) > 0 : p.discountPercent > 0)
        ? `${p.name} · ${discountLabel(p)} OFF` : p.name,
      unlocked: p.unlocked,
      pointsLeft: p.requiredPoints - points
    })));
  }
}
