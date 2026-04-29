import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLogoutDialogComponent } from '../../../app/shared/dialogs/confirm-logout/confirm-logout';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule],
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
    { icono: 'person',          label: 'SIDEBAR.PROFILE',          ruta: '/cliente/profile' },
    { icono: 'local_car_wash',  label: 'SIDEBAR.RESERVE', ruta: '/cliente/reserve' },
    { icono: 'credit_card',     label: 'SIDEBAR.PAYMENTS', ruta: '/cliente/payments' },
    { icono: 'notifications',   label: 'SIDEBAR.NOTIFICATIONS',  ruta: '/cliente/notifications' },
    { icono: 'history',         label: 'SIDEBAR.HISTORY',       ruta: '/cliente/history' },
    { icono: 'star_outline',    label: 'SIDEBAR.RATINGS',  ruta: '/cliente/ratings' },
    { icono: 'settings',        label: 'SIDEBAR.CONFIG',   ruta: '/cliente/configuration' },
  ];

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