// definimos el componente
import { Component } from '@angular/core';
// para navegar entre pantallas
import { Router, RouterModule } from '@angular/router';
// para usar *ngIf y *ngFor en el HTML
import { CommonModule } from '@angular/common';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
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
    { icono: 'person',           label: 'SIDEBAR.PROFILE',           ruta: '/cliente/profile' },
    { icono: 'local_car_wash',   label: 'SIDEBAR.RESERVE',  ruta: '/cliente/reserve' },
    { icono: 'credit_card',      label: 'SIDEBAR.PAYMENTS',  ruta: '/cliente/payments' },
    { icono: 'notifications',    label: 'SIDEBAR.NOTIFICATIONS',   ruta: '/cliente/notifications' },
    { icono: 'history',          label: 'SIDEBAR.HISTORY',        ruta: '/cliente/history' },
    { icono: 'star_outline',     label: 'SIDEBAR.RATINGS',   ruta: '/cliente/ratings' },
    { icono: 'settings',         label: 'SIDEBAR.CONFIG',    ruta: '/cliente/configuration' },
  ];

  constructor(private router: Router) {}

  cerrarSesion() {
    this.router.navigate(['/auth/login']);
  }
}