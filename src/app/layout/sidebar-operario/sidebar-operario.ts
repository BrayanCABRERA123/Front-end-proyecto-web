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

  // datos del operario que se muestran en el sidebar
  usuario = {
    nombre: 'Juan Díaz',
    correo: 'juan@email.com',
    iniciales: 'JD'
  };

  // menú del operario — diferente al del cliente
  menuItems = [
    { icono: 'person',            label: 'Perfil',               ruta: '/operario/profile' },
    { icono: 'assignment',        label: 'Servicios Asignados',   ruta: '/operario/assigned-services' },
    { icono: 'notifications',     label: 'Notificaciones',        ruta: '/operario/notifications' },
    { icono: 'history',           label: 'Historial',             ruta: '/operario/service-history' },
    { icono: 'star_outline',      label: 'Calificaciones',        ruta: '/operario/ratings' },
    { icono: 'settings',          label: 'Configuración',         ruta: '/operario/settings' },
  ];

  constructor(private router: Router) {}

  // navega al login al cerrar sesión
  cerrarSesion() {
    this.router.navigate(['/auth/login']);
  }
}