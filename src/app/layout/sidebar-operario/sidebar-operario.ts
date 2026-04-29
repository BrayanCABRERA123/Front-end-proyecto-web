import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar-operario',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar-operario.html',
  styleUrl: './sidebar-operario.scss'
})
export class SidebarOperarioComponent {

  // controla si el sidebar está abierto en mobile
  isOpen: boolean = false;

  usuario = {
    nombre: 'Juan Díaz',
    correo: 'juan@email.com',
    iniciales: 'JD'
  };

  menuItems = [
    { icono: 'person',       label: 'Perfil',             ruta: '/operario/profile' },
    { icono: 'assignment',   label: 'Servicios Asignados', ruta: '/operario/assigned-services' },
    { icono: 'notifications',label: 'Notificaciones',      ruta: '/operario/notifications' },
    { icono: 'history',      label: 'Historial',           ruta: '/operario/service-history' },
    { icono: 'star_outline', label: 'Calificaciones',      ruta: '/operario/qualifications' },
    { icono: 'settings',     label: 'Configuración',       ruta: '/operario/settings' },
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