import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications';

// la bandeja la carga <app-notifications> desde el notification-service (sin datos de prueba)
@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, NotificationsComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class AdminNotificationsComponent {}
