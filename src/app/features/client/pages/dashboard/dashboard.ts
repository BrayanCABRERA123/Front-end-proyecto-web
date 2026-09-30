// definimos el componente
import { Component, OnInit, inject } from '@angular/core';
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
import { BUSINESS_LOCATION } from '../../../../core/constants/business-location';
// servicios reales del backend
import { VehiclesService } from '../../../../core/services/vehicles';
import { UserSession } from '../../../../core/services/user-session';
import { VehicleResponse } from '../../../../core/models/vehicle.models';

// avance del servicio según su estado (Confirmado → En lavado → Listo → Finalizado)
const PROGRESS_BY_STATUS: Record<string, number> = {
  CONFIRMED: 25,
  IN_WASH: 50,
  READY: 75,
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

  // estadísticas rápidas del cliente
  // vehículos: real del backend. reservas y lavados: vienen de booking-service (pendiente)
  stats = [
    { icon: 'calendar_today', value: 0, label: 'STATS.ACTIVE_RESERVATIONS' },
    { icon: 'directions_car', value: 0, label: 'STATS.MY_VEHICLES' },
    { icon: 'water_drop', value: 0, label: 'STATS.WASHES_DONE' }
  ];

  // próximo servicio programado (viene de booking-service, pendiente)
  nextService: {
    type: string;
    vehicle: string;
    plate: string;
    date: string;
    operator: string;
    status: string;
  } | null = null;

  // lugar del servicio (sede única del lavadero)
  location = BUSINESS_LOCATION;

  // vehículos registrados por el cliente (reales del backend)
  vehicles: VehicleResponse[] = [];

  // beneficios y promociones (vienen de booking-service, pendiente)
  benefits: { title: string; description: string }[] = [];

  // progreso del programa de fidelidad (viene de customer-service, pendiente)
  loyalty: { current: number; goal: number; percentage: number } | null = null;

  // vista previa del historial de servicios (viene de booking-service, pendiente)
  serviceHistory: {
    code: string;
    type: string;
    vehicle: string;
    date: string;
    operator: string;
    price: number;
    status: string;
  }[] = [];

  //CONSTRUCTOR
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.userName = this.userSession.user().name;
    this.loadVehicles();
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
        { label: 'RESERVE.SUMMARY.SERVICE', value: t(`SERVICE.${service.type}`) },
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${t(`VEHICLE.${service.vehicle}`)} · ${service.plate}` },
        { label: 'RESERVE.SUMMARY.DATE', value: service.date },
        { label: 'RESERVE.SUMMARY.LOCATION', value: this.location.address },
        { label: 'DASHBOARD.NEXT_SERVICE.OPERATOR_ASSIGNED', value: service.operator },
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
