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
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent {

  // datos del usuario
  usuario = {
    nombre: 'Juan'
  };

  // tarjetas de resumen (AHORA con claves)
  resumen = [
    { icono: 'calendar_today', cantidad: 2, label: 'HOME.RESUMEN.ACTIVE' },
    { icono: 'directions_car', cantidad: 3, label: 'HOME.RESUMEN.VEHICLES' },
    { icono: 'notifications',  cantidad: 5, label: 'HOME.RESUMEN.NOTIFICATIONS', ruta: 'notifications' },
  ];

  // próximas reservas (TODO con claves)
  proximasReservas = [
    {
      tipo: 'PREMIUM',
      vehiculo: 'CAR',
      fecha: '25/02/2026 10:00',
      estado: 'CONFIRMED'
    },
    {
      tipo: 'BASIC',
      vehiculo: 'TRUCK',
      fecha: '28/02/2026 14:00',
      estado: 'CONFIRMED'
    }
  ];

  //CONSTRUCTOR
  constructor(private router: Router) {}

  // METODO
  irA(ruta: string | null | undefined) {
    if (ruta) {
      this.router.navigate(['/cliente', ruta]);
    }
  }

}