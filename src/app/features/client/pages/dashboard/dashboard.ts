// definimos el componente
import { Component } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

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
    address: 'Cra. 45 #23-10, Bogotá',
    operator: 'Laura Gómez',
    status: 'ON_THE_WAY',
    progress: 60
  };

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
  constructor(private router: Router) {}

  // METODO
  goTo(route: string | null | undefined) {
    if (route) {
      this.router.navigate(['/client', route]);
    }
  }

}
