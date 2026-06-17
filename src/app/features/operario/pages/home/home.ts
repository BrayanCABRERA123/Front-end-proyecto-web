import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del operator
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { StatsCardComponent } from './components/stats-card/stats-card';
import { PendingServiceCardComponent } from './components/pending-service-card/pending-service-card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    StatsCardComponent,
    PendingServiceCardComponent,
    MatIconModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {

  // datos del operator
  nombreOperator: string = 'Camilo';

  // estadísticas que se muestran en las cards superiores
  stats = [
    { icono: 'calendar_today',  valor: 5,   label: 'Reservas Asignadas',  notificacion: 0 },
    { icono: 'directions_car',  valor: 3,   label: 'Vehículos',           notificacion: 0 },
    { icono: 'notifications',   valor: 5,   label: 'Notificaciones',      notificacion: 2 },
    { icono: 'star_outline',    valor: 4.3, label: 'Calificación',        notificacion: 0 }
  ];

  // datos de progreso del día
  serviciosCompletados: number = 1;
  totalServicios: number = 5;
  enProgreso: number = 2;
  pendientes: number = 2;

  // lista de reservas pendientes
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

  // calcula el porcentaje de progreso del día
  get porcentajeProgreso(): number {
    return (this.serviciosCompletados / this.totalServicios) * 100;
  }
}