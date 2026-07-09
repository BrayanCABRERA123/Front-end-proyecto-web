import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { StatsCardComponent } from './components/stats-card/stats-card';
import { PendingServiceCardComponent } from './components/pending-service-card/pending-service-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    PendingServiceCardComponent,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {

  nombreOperator: string = 'Camilo';

  stats = [
    { icono: 'calendar_today', valor: 5,   label: 'OPERATOR_HOME.STATS.ASSIGNED',     notificacion: 0 },
    { icono: 'directions_car', valor: 3,   label: 'OPERATOR_HOME.STATS.VEHICLES',      notificacion: 0 },
    { icono: 'notifications',  valor: 5,   label: 'OPERATOR_HOME.STATS.NOTIFICATIONS', notificacion: 2 },
    { icono: 'star_outline',   valor: 4.3, label: 'OPERATOR_HOME.STATS.RATING',        notificacion: 0 }
  ];

  serviciosCompletados: number = 1;
  totalServicios: number = 5;
  enProgreso: number = 2;
  pendientes: number = 2;

  reservasPendientes = [
    {
      id: 1,
      titulo: 'Premium — Automovil',
      fecha: '28 Feb 2026 a las 2:00 PM',
      direccion: 'calle sur 123, los rosales',
      client: 'Juan Felipe Gonzales',
      estado: 'Confirmado',
      estadoColor: 'confirmado'
    },
    {
      id: 2,
      titulo: 'Básico — Camioneta',
      fecha: '28 Feb 2026 a las 2:00 PM',
      direccion: 'calle norte 7 06, mira flores',
      client: 'Esneider Sanchez',
      estado: 'Pendiente',
      estadoColor: 'pendiente'
    }
  ];

  get porcentajeProgreso(): number {
    return (this.serviciosCompletados / this.totalServicios) * 100;
  }
}