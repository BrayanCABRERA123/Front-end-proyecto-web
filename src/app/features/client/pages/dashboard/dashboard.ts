// definimos el componente
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable que también muestra una lista de detalles
import { StatusModal, StatusModalData } from '../../../../shared/dialogs/status-modal/status-modal';
// sede del lavadero: el cliente lleva su vehículo allí (no es a domicilio)
// sede del lavadero (booking-service)
import { BookingApiService } from '../../../../core/services/booking-api';
import { BookingResponse, EstablishmentResponse } from '../../../../core/models/booking.models';
import { isActiveStatus, isFinishedStatus, isoToDisplayDate, servicesLabel, vehicleLabel } from '../../../../core/utils/booking-display';
// servicios reales del backend
import { VehiclesService } from '../../../../core/services/vehicles';
import { UserSession } from '../../../../core/services/user-session';
import { VehicleResponse } from '../../../../core/models/vehicle.models';

// avance del servicio según su estado (Programado → Confirmado → En progreso → Finalizado)
const PROGRESS_BY_STATUS: Record<string, number> = {
  SCHEDULED: 10,
  CONFIRMED: 25,
  IN_PROGRESS: 50,
  COMPLETED: 100
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {

  private readonly vehiclesService = inject(VehiclesService);
  private readonly userSession = inject(UserSession);

  // datos del usuario (vienen del login real)
  userName = '';

  // notificaciones
  notifications = [
    { icon: 'notifications', route: 'notifications' },
  ];

  // estadísticas rápidas del cliente (vehículos, reservas y lavados reales del backend)
  stats = [
    { icon: 'calendar_today', value: 0, label: 'STATS.ACTIVE_RESERVATIONS' },
    { icon: 'directions_car', value: 0, label: 'STATS.MY_VEHICLES' },
    { icon: 'water_drop', value: 0, label: 'STATS.WASHES_DONE' }
  ];

  // próximo servicio programado (la primera reserva activa del booking-service)
  nextService: {
    serviceName: string;
    vehicle: string;
    plate: string;
    date: string;
    operator: string;
    status: string;
  } | null = null;

  // lugar del servicio (sede única del lavadero)
  // sede del lavadero, leída del booking-service
  location: EstablishmentResponse | null = null;
  private readonly bookingApi = inject(BookingApiService);
  private readonly changes = inject(ChangeDetectorRef);

  // vehículos registrados por el cliente (reales del backend)
  vehicles: VehicleResponse[] = [];

  // beneficios y promociones (contenido comercial, vendrá del backend)
  benefits = [
    { title: '20% OFF en tu 5° lavado', description: 'Te faltan 1 servicio para desbloquearlo' },
    { title: 'Lavado Premium a precio Básico', description: 'Válido hasta el 30 de septiembre' }
  ];

  // progreso del programa de fidelidad
  loyalty = {
    current: 4,
    goal: 5,
    percentage: 80
  };

  //CONSTRUCTOR
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.userName = this.userSession.user().name;
    this.loadVehicles();
    this.loadBookings();
    this.bookingApi.establishment().subscribe({
      next: (location) => {
        this.location = location;
        this.changes.markForCheck();
      },
      error: () => { this.location = null; }
    });
  }

  private loadVehicles(): void {
    this.vehiclesService.list().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        // actualiza el stat de vehículos con el número real
        const stat = this.stats.find(s => s.label === 'STATS.MY_VEHICLES');
        if (stat) stat.value = vehicles.length;
      },
      error: () => {
        // si no hay perfil o hay error, queda en 0
        this.vehicles = [];
      }
    });
  }

  // reservas reales del cliente: alimentan los contadores y el "próximo servicio"
  private loadBookings(): void {
    this.bookingApi.myBookings().subscribe({
      next: (bookings) => {
        this.applyBookings(bookings);
        this.changes.markForCheck();
      },
      error: () => {
        // sin reservas (o backend caído) los contadores quedan en 0 y no hay próximo servicio
        this.nextService = null;
        this.changes.markForCheck();
      }
    });
  }

  private applyBookings(bookings: BookingResponse[]): void {
    const active = bookings.filter(booking => isActiveStatus(booking.status));
    const finished = bookings.filter(booking => isFinishedStatus(booking.status));

    this.setStat('STATS.ACTIVE_RESERVATIONS', active.length);
    this.setStat('STATS.WASHES_DONE', finished.length);

    // la próxima: la reserva activa con fecha y hora más cercanas desde hoy
    const today = this.isoDate(new Date());
    const upcoming = active
      .filter(booking => booking.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

    const next = upcoming[0];
    this.nextService = next ? {
      serviceName: servicesLabel(next),
      vehicle: vehicleLabel(next.vehicle),
      plate: next.vehicle?.licensePlateFormatted ?? '',
      date: `${isoToDisplayDate(next.date)} · ${next.startTime} - ${next.endTime}`,
      operator: '',
      status: next.status
    } : null;
  }

  private setStat(label: string, value: number): void {
    const stat = this.stats.find(s => s.label === label);
    if (stat) stat.value = value;
  }

  private isoDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  // porcentaje de avance calculado a partir del estado del servicio
  get nextServiceProgress(): number {
    return this.nextService ? (PROGRESS_BY_STATUS[this.nextService.status] ?? 0) : 0;
  }

  // accesos rápidos
  quickAccess = [
    { icon: 'calendar_today', label: 'QUICK_ACCESS.BOOK_WASH', route: 'reserve' },
    { icon: 'credit_card', label: 'QUICK_ACCESS.PAY_SERVICE', route: 'history' },
    { icon: 'directions_car', label: 'QUICK_ACCESS.MY_VEHICLES', route: 'vehicles' },
    { icon: 'notifications', label: 'QUICK_ACCESS.NOTIFICATIONS', route: 'notifications' }
  ];

  // METODO
  goTo(route: string | null | undefined) {
    if (route) {
      this.router.navigate(['/client', route]);
    }
  }

  // muestra el detalle del próximo servicio en el modal de estado (tipo info)
  viewNextServiceDetail() {
    if (!this.nextService) return;
    const service = this.nextService;
    const t = (key: string) => this.translate.instant(key);

    const data: StatusModalData = {
      type: 'info',
      icon: 'event',
      title: 'DASHBOARD.NEXT_SERVICE.TITLE',
      message: 'DASHBOARD.NEXT_SERVICE.DETAIL_MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'RESERVE.SUMMARY.SERVICE', value: service.serviceName },
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${service.vehicle} · ${service.plate}`.trim() },
        { label: 'RESERVE.SUMMARY.DATE', value: service.date },
        { label: 'RESERVE.SUMMARY.LOCATION', value: this.location?.address ?? '' },
        { label: 'DASHBOARD.NEXT_SERVICE.OPERATOR_ASSIGNED', value: service.operator || '—' },
        { label: 'DASHBOARD.NEXT_SERVICE.STATUS', value: t(`STATUS.${service.status}`) },
        { label: 'DASHBOARD.NEXT_SERVICE.PROGRESS', value: `${this.nextServiceProgress}%` }
      ]
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }

}
