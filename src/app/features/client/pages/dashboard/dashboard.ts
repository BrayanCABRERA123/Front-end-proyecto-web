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
  usuario = {
    nombre: 'Juan'
  };

  // notificaciones
  notificaciones = [
    { camp: 'notifications', ruta: 'notifications' },
  ];

  // estadísticas rápidas del cliente
  estadisticas = [
    { icono: 'calendar_today', valor: 2, label: 'STATS.ACTIVE_RESERVATIONS' },
    { icono: 'directions_car', valor: 3, label: 'STATS.MY_VEHICLES' },
    { icono: 'water_drop', valor: 14, label: 'STATS.WASHES_DONE' }
  ];

  // próximo servicio programado
  proximoServicio = {
    codigo: 'SV-1055',
    tipo: 'PREMIUM',
    vehiculo: 'CAR',
    placa: 'ABC-123',
    fecha: '25/02/2026 10:00 AM',
    direccion: 'Cra. 45 #23-10, Bogotá',
    operario: 'Laura Gómez',
    estado: 'ON_THE_WAY',
    avance: 60
  };

  // accesos rápidos
  accesosRapidos = [
    { icono: 'calendar_today', label: 'QUICK_ACCESS.BOOK_WASH', ruta: 'reserve' },
    { icono: 'credit_card', label: 'QUICK_ACCESS.PAY_SERVICE', ruta: 'payment' },
    { icono: 'directions_car', label: 'QUICK_ACCESS.MY_VEHICLES', ruta: 'vehicles' },
    { icono: 'notifications', label: 'QUICK_ACCESS.NOTIFICATIONS', ruta: 'notifications' }
  ];

  // vehículos registrados por el cliente
  vehiculos = [
    { tipo: 'CAR', placa: 'ABC-123', ultimoLavado: '10 Ago 2026' },
    { tipo: 'MOTO', placa: 'XYZ-98D', ultimoLavado: '02 Ago 2026' },
    { tipo: 'TRUCK', placa: 'JKL-457', ultimoLavado: '24 Jul 2026' }
  ];

  // beneficios y promociones (contenido comercial, vendrá del backend)
  beneficios = [
    { titulo: '20% OFF en tu 5° lavado', descripcion: 'Te faltan 1 servicio para desbloquearlo' },
    { titulo: 'Lavado Premium a precio Básico', descripcion: 'Válido hasta el 30 de septiembre' }
  ];

  // progreso del programa de fidelidad
  fidelidad = {
    actual: 4,
    meta: 5,
    porcentaje: 80
  };

  // vista previa del historial de servicios
  historialServicios = [
    { codigo: 'SV-1042', tipo: 'PREMIUM', vehiculo: 'CAR', fecha: '10 Ago 2026', operario: 'Laura Gómez', precio: 45000, estado: 'COMPLETED' },
    { codigo: 'SV-1031', tipo: 'BASIC', vehiculo: 'MOTO', fecha: '02 Ago 2026', operario: 'Miguel Rojas', precio: 18000, estado: 'COMPLETED' },
    { codigo: 'SV-1020', tipo: 'FULL', vehiculo: 'TRUCK', fecha: '24 Jul 2026', operario: 'Juan Díaz', precio: 0, estado: 'CANCELED' }
  ];

  //CONSTRUCTOR
  constructor(private router: Router) {}

  // METODO
  irA(ruta: string | null | undefined) {
    if (ruta) {
      this.router.navigate(['/client', ruta]);
    }
  }

}
