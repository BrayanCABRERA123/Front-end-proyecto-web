// definimos el componente
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { ClientDashboardService } from '../../../../core/services/client-dashboard';
import { Booking } from '../../../../core/services/bookings';
import { Vehicle } from '../../../../core/services/vehicles';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {

  // datos del usuario
  user = { name: '' };

  // campanita de notificaciones (solo navega a /client/notifications)
  notifications = [
    { icon: 'notifications', route: 'notifications' },
  ];

  // estadísticas rápidas del cliente
  stats: { icon: string; value: number; label: string }[] = [];

  // próximo servicio programado (null si no tiene ninguno agendado)
  nextService: Booking | null = null;

  // accesos rápidos
  quickAccess = [
    { icon: 'calendar_today', label: 'QUICK_ACCESS.BOOK_WASH', route: 'reserve' },
    { icon: 'credit_card', label: 'QUICK_ACCESS.PAY_SERVICE', route: 'history' },
    { icon: 'directions_car', label: 'QUICK_ACCESS.MY_VEHICLES', route: 'vehicles' },
    { icon: 'notifications', label: 'QUICK_ACCESS.NOTIFICATIONS', route: 'notifications' }
  ];

  // vehículos registrados por el cliente
  vehicles: Vehicle[] = [];

  // beneficios y promociones (del catálogo de promociones activas)
  benefits: { title: string; description: string }[] = [];

  // progreso del programa de fidelidad
  loyalty = { current: 0, goal: 5, percentage: 0 };

  // vista previa del historial de servicios
  serviceHistory: Booking[] = [];

  constructor(
    private router: Router,
    private auth: Auth,
    private dashboardService: ClientDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user.name = this.auth.getCurrentUser()?.nombre.split(' ')[0] ?? '';

    this.dashboardService.get$().subscribe(data => {
      this.stats = [
        { icon: 'calendar_today', value: data.stats.activeReservations, label: 'STATS.ACTIVE_RESERVATIONS' },
        { icon: 'directions_car', value: data.stats.vehicles, label: 'STATS.MY_VEHICLES' },
        { icon: 'water_drop', value: data.stats.washesDone, label: 'STATS.WASHES_DONE' }
      ];
      this.nextService = data.nextService;
      this.vehicles = data.vehicles;
      this.benefits = data.benefits;
      this.loyalty = data.loyalty;
      this.serviceHistory = data.serviceHistory;
      this.cdr.markForCheck();
    });
  }

  // METODO
  goTo(route: string | null | undefined) {
    if (route) {
      this.router.navigate(['/client', route]);
    }
  }

}
