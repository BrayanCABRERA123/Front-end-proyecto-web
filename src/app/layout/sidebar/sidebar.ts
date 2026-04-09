// definimos el componente
import { Component } from '@angular/core';
// para navegar entre pantallas
import { Router, RouterModule } from '@angular/router';
// para usar *ngIf y *ngFor en el HTML
import { CommonModule } from '@angular/common';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {

  // datos del usuario que se muestran en el sidebar
  usuario = {
    nombre: 'Juan Díaz',
    correo: 'juan@email.com',
    iniciales: 'JD'
  };

  // lista de opciones del menú con iconos de Material
  menuItems = [
    { icono: 'person',           label: 'Perfil',           ruta: '/cliente/profile' },
    { icono: 'local_car_wash',   label: 'Reservar Lavado',  ruta: '/cliente/reserve' },
    { icono: 'credit_card',      label: 'Métodos de Pago',  ruta: '/cliente/payments' },
    { icono: 'notifications',    label: 'Notificaciones',   ruta: '/cliente/notifications' },
    { icono: 'history',          label: 'Historial',        ruta: '/cliente/history' },
    { icono: 'star_outline',     label: 'Calificaciones',   ruta: '/cliente/ratings' },
    { icono: 'settings',         label: 'Configuración',    ruta: '/cliente/configuracion' },
  ];

  constructor(private router: Router) {}

  cerrarSesion() {
    this.router.navigate(['/auth/login']);
  }
}