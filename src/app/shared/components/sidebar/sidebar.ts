import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLogoutDialogComponent } from '../../../shared/dialogs/confirm-logout/confirm-logout';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})

export class SidebarComponent implements OnInit {
  @Input() rol: 'CLIENTE' | 'OPERARIO' | 'ADMIN' = 'CLIENTE';
  // controla si el sidebar está abierto en mobile
  isOpen: boolean = false;
  logoRoute = '/';

  usuario = {
    nombre: 'Juan Díaz',
    correo: 'juan@email.com',
    iniciales: 'JD'
  };

  /*Menu opciones Cliente */
  clienteMenu = [
    { icono: 'person', label: 'SIDEBAR.PROFILE', ruta: '/cliente/profile' },
    { icono: 'local_car_wash', label: 'SIDEBAR.RESERVE', ruta: '/cliente/reserve' },
    { icono: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', ruta: '/cliente/notifications' },
    { icono: 'history', label: 'SIDEBAR.HISTORY', ruta: '/cliente/history' },
    { icono: 'star_outline', label: 'SIDEBAR.RATINGS', ruta: '/cliente/ratings' },
    { icono: 'settings', label: 'SIDEBAR.CONFIG', ruta: '/cliente/configuration' }
  ];
  /*Menu opciones Operario */
  operarioMenu = [
  { icono: 'person', label: 'SIDEBAR.PROFILE', ruta: '/operario/profile' },
  { icono: 'assignment', label: 'SIDEBAR.ASSIGNED_SERVICES', ruta: '/operario/assigned-services' },
  { icono: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', ruta: '/operario/notifications' },
  { icono: 'history', label: 'SIDEBAR.HISTORY', ruta: '/operario/service-history' },
  { icono: 'star_outline', label: 'SIDEBAR.RATINGS', ruta: '/operario/qualifications' },
  { icono: 'settings', label: 'SIDEBAR.CONFIG', ruta: '/operario/settings' }
];
/*Menu opciones administrador */
  adminMenu = [
    { icono: 'build', label: 'SIDEBAR.SERVICES', ruta: '/admin/services' },
    { icono: 'payments', label: 'SIDEBAR.PAYMENTS', ruta: '/admin/payments' },
    { icono: 'bar_chart', label: 'SIDEBAR.REPORTS', ruta: '/admin/reports' },
    { icono: 'settings', label: 'SIDEBAR.CONFIG', ruta: '/admin/settings' }
  ];

  menuItems: {
    icono: string;
    label: string;
    ruta: string;
  }[] = [];


  ngOnInit(): void {

    switch (this.rol) {

      case 'CLIENTE':
        this.menuItems = this.clienteMenu;
        this.logoRoute = '/cliente';
        break;

      case 'OPERARIO':
        this.menuItems = this.operarioMenu;
        this.logoRoute = '/operario';

        break;

      case 'ADMIN':
        this.menuItems = this.adminMenu;
        this.logoRoute = '/admin';
        break;

    }

  }

  constructor(private router: Router, private dialog: MatDialog) {}

  // abre o cierra el sidebar en mobile
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // cierra el sidebar al hacer clic en un item
  closeSidebar(): void {
    this.isOpen = false;
  }

  cerrarSesion() {
    const dialogRef = this.dialog.open(ConfirmLogoutDialogComponent, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(confirmado => {

      if (confirmado) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

      this.router.navigateByUrl('/');
      }
    });
  }
}