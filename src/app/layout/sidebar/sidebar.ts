import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent {

  // controla si el sidebar está abierto en mobile
  isOpen: boolean = false;

  usuario = {
    nombre: 'Juan Díaz',
    correo: 'juan@email.com',
    iniciales: 'JD'
  };

  menuItems = [
    { icono: 'person',          label: 'Perfil',          ruta: '/cliente/profile' },
    { icono: 'local_car_wash',  label: 'Reservar Lavado', ruta: '/cliente/reserve' },
    { icono: 'credit_card',     label: 'Métodos de Pago', ruta: '/cliente/payments' },
    { icono: 'notifications',   label: 'Notificaciones',  ruta: '/cliente/notifications' },
    { icono: 'history',         label: 'Historial',       ruta: '/cliente/history' },
    { icono: 'star_outline',    label: 'Calificaciones',  ruta: '/cliente/ratings' },
    { icono: 'settings',        label: 'Configuración',   ruta: '/cliente/configuration' },
  ];

  constructor(private router: Router) {}

  // abre o cierra el sidebar en mobile
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // cierra el sidebar al hacer clic en un item
  closeSidebar(): void {
    this.isOpen = false;
  }

  cerrarSesion() {
    this.router.navigate(['/auth/login']);
  }
}