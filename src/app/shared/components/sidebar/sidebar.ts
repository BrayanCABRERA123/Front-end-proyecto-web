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
  @Input() rol: 'CLIENT' | 'OPERATOR' | 'ADMIN' = 'CLIENT';
  // controla si el sidebar está abierto en mobile
  isOpen: boolean = false;
  logoRoute = '/';

  user = {
    name: 'Juan Díaz',
    email: 'juan@email.com',
    initials: 'JD'
  };

  /*Menu opciones Client */
  clientMenu = [
    { icon: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', route: '/client' },
    { icon: 'person', label: 'SIDEBAR.PROFILE', route: '/client/profile' },
    { icon: 'directions_car', label: 'SIDEBAR.VEHICLES', route: '/client/vehicles' },
    { icon: 'local_car_wash', label: 'SIDEBAR.RESERVE', route: '/client/reserve' },
    { icon: 'credit_card', label: 'SIDEBAR.PAYMENT', route: '/client/payment' },
    { icon: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', route: '/client/notifications' },
    { icon: 'history', label: 'SIDEBAR.HISTORY', route: '/client/history' },
    { icon: 'settings', label: 'SIDEBAR.CONFIG', route: '/client/configuration' }
  ];
  /*Menu opciones Operator */
    operatorMenu = [
  { icon: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', route: '/operator' },
  { icon: 'person', label: 'SIDEBAR.PROFILE', route: '/operator/profile' },
  { icon: 'calendar_month', label: 'SIDEBAR.SCHEDULE', route: '/operator/schedule' },
  { icon: 'assignment', label: 'SIDEBAR.ASSIGNED_SERVICES', route: '/operator/assigned-services' },
  { icon: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', route: '/operator/notifications' },
  { icon: 'history', label: 'SIDEBAR.HISTORY', route: '/operator/service-history' },
  { icon: 'star_outline', label: 'SIDEBAR.RATINGS', route: '/operator/qualifications' },
  { icon: 'settings', label: 'SIDEBAR.CONFIG', route: '/operator/settings' }
];

/* Admin role menu — matches the approved mockups (Sept 2026) */
  adminMenu = [
    { icon: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', route: '/admin' },
    { icon: 'person', label: 'SIDEBAR.PROFILE', route: '/admin/profile' },
    { icon: 'event_available', label: 'SIDEBAR.RESERVATIONS', route: '/admin/reservations' },
    { icon: 'payments', label: 'SIDEBAR.PAYMENTS', route: '/admin/payments' },
    { icon: 'admin_panel_settings', label: 'SIDEBAR.MANAGEMENT', route: '/admin/management' },
    { icon: 'schedule', label: 'SIDEBAR.SCHEDULE_BAYS', route: '/admin/schedule' },
    { icon: 'engineering', label: 'SIDEBAR.OPERATORS', route: '/admin/operators' },
    { icon: 'bar_chart', label: 'SIDEBAR.REPORTS', route: '/admin/reports' },
    { icon: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', route: '/admin/notifications' },
    { icon: 'settings', label: 'SIDEBAR.CONFIG', route: '/admin/settings' }
  ];

  menuItems: {
    icon: string;
    label: string;
    route: string;
  }[] = [];


  ngOnInit(): void {

    switch (this.rol) {

      case 'CLIENT':
        this.menuItems = this.clientMenu;
        this.logoRoute = '/client';
        break;

      case 'OPERATOR':
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

  logout() {
    const dialogRef = this.dialog.open(ConfirmLogoutDialogComponent, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(confirmed => {

      if (confirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

      this.router.navigateByUrl('/');
      }
    });
  }
}
