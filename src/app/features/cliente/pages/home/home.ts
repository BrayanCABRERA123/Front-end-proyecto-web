// definimos el componente
import { Component } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar que creamos
import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {

  // datos del usuario
  usuario = {
    nombre: 'Juan'
  };

  // tarjetas de resumen arriba
  resumen = [
    { icono: 'calendar_today', cantidad: 2, label: 'Reservas Activas' },
    { icono: 'directions_car', cantidad: 3, label: 'Vehículos' },
    { icono: 'notifications',  cantidad: 5, label: 'Notificaciones' },
  ];

  // lista de próximas reservas
  proximasReservas = [
    {
      tipo: 'Premium',
      vehiculo: 'Automóvil',
      fecha: '25 Feb 2026 a las 10:00 AM',
      estado: 'Confirmado'
    },
    {
      tipo: 'Básico',
      vehiculo: 'Camioneta',
      fecha: '28 Feb 2026 a las 2:00 PM',
      estado: 'Confirmado'
    }
  ];
}