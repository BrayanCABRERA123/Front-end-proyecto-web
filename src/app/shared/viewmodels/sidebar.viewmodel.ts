import { Injectable, computed, inject, signal } from '@angular/core';

// usuario de la sesión: el mismo que se edita en el perfil
import { UserSession } from '../../core/services/user-session';
import { AuthService } from '../../core/services/auth';
import { NotificationWatcher } from '../../core/services/notification-watcher';

export type SidebarRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export interface SidebarItem {
  icon: string;
  label: string;
  route: string;
}

const MENUS: Record<SidebarRole, SidebarItem[]> = {
  CLIENT: [
    { icon: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', route: '/client' },
    { icon: 'person', label: 'SIDEBAR.PROFILE', route: '/client/profile' },
    { icon: 'directions_car', label: 'SIDEBAR.VEHICLES', route: '/client/vehicles' },
    { icon: 'local_car_wash', label: 'SIDEBAR.RESERVE', route: '/client/reserve' },
    { icon: 'credit_card', label: 'SIDEBAR.PAYMENT', route: '/client/payment' },
    { icon: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', route: '/client/notifications' },
    { icon: 'history', label: 'SIDEBAR.HISTORY', route: '/client/history' },
    { icon: 'settings', label: 'SIDEBAR.CONFIG', route: '/client/configuration' }
  ],
  OPERATOR: [
    { icon: 'space_dashboard', label: 'SIDEBAR.DASHBOARD', route: '/operator' },
    { icon: 'person', label: 'SIDEBAR.PROFILE', route: '/operator/profile' },
    { icon: 'calendar_month', label: 'SIDEBAR.SCHEDULE', route: '/operator/schedule' },
    { icon: 'assignment', label: 'SIDEBAR.ASSIGNED_SERVICES', route: '/operator/assigned-services' },
    { icon: 'notifications', label: 'SIDEBAR.NOTIFICATIONS', route: '/operator/notifications' },
    { icon: 'history', label: 'SIDEBAR.HISTORY', route: '/operator/service-history' },
    { icon: 'star_outline', label: 'SIDEBAR.RATINGS', route: '/operator/qualifications' },
    { icon: 'settings', label: 'SIDEBAR.CONFIG', route: '/operator/settings' }
  ],
  // el mismo orden de los mockups aprobados (sept. 2026)
  ADMIN: [
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
  ]
};

/** Menú lateral de los 3 roles: sus opciones, el usuario de la sesión y las notificaciones sin leer. */
@Injectable()
export class SidebarViewModel {

  private readonly session = inject(UserSession);
  private readonly auth = inject(AuthService);
  private readonly watcher = inject(NotificationWatcher);

  private readonly role = signal<SidebarRole>('CLIENT');
  readonly menuItems = computed(() => MENUS[this.role()]);

  // se actualiza solo cuando el usuario cambia su nombre o correo en el perfil
  readonly user = computed(() => ({
    name: this.session.user().name,
    email: this.session.user().email,
    initials: this.session.initials()
  }));

  // no leídas: el número junto a "Notificaciones" del menú (se actualiza solo)
  readonly unread = this.watcher.unread;

  start(role: SidebarRole): void {
    this.role.set(role);
    this.watcher.start();
  }

  // cierra la sesión en el servidor, limpia el navegador y vuelve al login
  logout(): void {
    this.auth.logout();
  }
}
