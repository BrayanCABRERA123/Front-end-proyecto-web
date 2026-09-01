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

  /*Menu opciones Client */
  clientMenu = [
    { icono: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', ruta: '/client' },
    { icono: 'person', label: 'SIDEBAR.PROFILE', ruta: '/client/profile' },
    { icono: 'local_car_wash', label: 'SIDEBAR.RESERVE', ruta: '/client/reserve' },
    { icono: 'credit_card', label: 'SIDEBAR.PAYMENT', ruta: '/client/payment' },
    { icono: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', ruta: '/client/notifications' },
    { icono: 'history', label: 'SIDEBAR.HISTORY', ruta: '/client/history' },
    { icono: 'settings', label: 'SIDEBAR.CONFIG', ruta: '/client/configuration' }
  ];
  /*Menu opciones Operator */
  operatorMenu = [
  { icono: 'person', label: 'SIDEBAR.PROFILE', ruta: '/operator/profile' },
  { icono: 'assignment', label: 'SIDEBAR.ASSIGNED_SERVICES', ruta: '/operator/assigned-services' },
  { icono: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', ruta: '/operator/notifications' },
  { icono: 'history', label: 'SIDEBAR.HISTORY', ruta: '/operator/service-history' },
  { icono: 'star_outline', label: 'SIDEBAR.RATINGS', ruta: '/operator/qualifications' },
  { icono: 'settings', label: 'SIDEBAR.CONFIG', ruta: '/operator/settings' }
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
        this.menuItems = this.clientMenu;
        this.logoRoute = '/client';
        break;

      case 'OPERARIO':
        this.menuItems = this.operatorMenu;
        this.logoRoute = '/operator';
                                  
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