import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent, AppNotification } from '../../../../shared/components/notifications/notifications';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    MatIconModule,
    FormsModule,
    TranslateModule,
    NotificationsComponent
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class AdminNotificationsComponent {

  notifications: AppNotification[] = [
    {
      id: 1,
      icon: 'warning',
      type: 'recordatorio',
      title: 'NOTIFICATIONS.NEW_SERVICE',
      desc: 'NOTIFICATIONS.NEW_SERVICE_DESC',
      date: '2026-09-19',
      time: '08:40',
      read: false
    },
    {
      id: 2,
      icon: 'check_circle',
      type: 'confirmacion',
      title: 'NOTIFICATIONS.STATUS_UPDATE',
      desc: 'NOTIFICATIONS.STATUS_UPDATE_DESC',
      date: '2026-09-18',
      time: '16:05',
      read: true
    },
    {
      id: 3,
      icon: 'desktop_windows',
      type: 'sistema',
      title: 'NOTIFICATIONS.SYSTEM',
      desc: 'NOTIFICATIONS.SYSTEM_DESC',
      date: '2026-09-17',
      time: '09:00',
      read: true
    }
  ];

}
