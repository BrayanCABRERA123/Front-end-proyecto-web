// definimos el componente
import { Component } from '@angular/core';
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
export class DashboardComponent {

  // datos del usuario
  user = {
    name: 'Juan'
  };

  // notificaciones
  notifications = [
    { icon: 'notifications', route: 'notifications' },
  ];

  // estadísticas rápidas del cliente
  stats = [
    { icon: 'calendar_today', value: 2, label: 'STATS.ACTIVE_RESERVATIONS' },
    { icon: 'directions_car', value: 3, label: 'STATS.MY_VEHICLES' },
    { icon: 'water_drop', value: 14, label: 'STATS.WASHES_DONE' }
  ];

  // próximo servicio programado
  nextService = {
    type: 'PREMIUM',
    vehicle: 'CAR',
    plate: 'ABC-123',
    date: '25/02/2026 10:00 AM',
    operator: 'Laura Gómez',
    status: 'CONFIRMED'
  };

  // lugar del servicio (sede única del lavadero)
  location = BUSINESS_LOCATION;

  // porcentaje de avance calculado a partir del estado del servicio
  get nextServiceProgress(): number {
    return PROGRESS_BY_STATUS[this.nextService.status] ?? 0;
  }

  // accesos rápidos
  quickAccess = [
    { icon: 'calendar_today', label: 'QUICK_ACCESS.BOOK_WASH', route: 'reserve' },
    { icon: 'credit_card', label: 'QUICK_ACCESS.PAY_SERVICE', route: 'history' },
    { icon: 'directions_car', label: 'QUICK_ACCESS.MY_VEHICLES', route: 'vehicles' },
    { icon: 'notifications', label: 'QUICK_ACCESS.NOTIFICATIONS', route: 'notifications' }
  ];

  // vehículos registrados por el cliente
  vehicles = [
    { type: 'CAR', plate: 'ABC-123', lastWash: '10 Ago 2026' },
    { type: 'MOTO', plate: 'XYZ-98D', lastWash: '02 Ago 2026' },
    { type: 'TRUCK', plate: 'JKL-457', lastWash: '24 Jul 2026' }
  ];

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

  // vista previa del historial de servicios
  serviceHistory = [
    { code: 'SV-1042', type: 'PREMIUM', vehicle: 'CAR', date: '10 Ago 2026', operator: 'Laura Gómez', price: 45000, status: 'COMPLETED' },
    { code: 'SV-1031', type: 'BASIC', vehicle: 'MOTO', date: '02 Ago 2026', operator: 'Miguel Rojas', price: 18000, status: 'COMPLETED' },
    { code: 'SV-1020', type: 'FULL', vehicle: 'TRUCK', date: '24 Jul 2026', operator: 'Juan Díaz', price: 0, status: 'CANCELED' }
  ];

  //CONSTRUCTOR
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  // METODO
  goTo(route: string | null | undefined) {
    if (route) {
      this.router.navigate(['/client', route]);
    }
  }

  // muestra el detalle del próximo servicio en el modal de estado (tipo info)
  viewNextServiceDetail() {
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
