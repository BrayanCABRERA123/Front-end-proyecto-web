import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent, AppNotification } from '../../../../shared/components/notifications/notifications';

@Component({
  selector: 'app-operator-notifications',
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
export class OperatorNotificationsComponent {

  notifications: AppNotification[] = [
    {
      id: 1,
      icon: 'schedule',
      type: 'recordatorio',
      title: 'NOTIFICATIONS.NEW_SERVICE',
      desc: 'NOTIFICATIONS.NEW_SERVICE_DESC',
      date: '2025-03-12',
      time: '09:14',
      read: false
    },
    {
      id: 2,
      icon: 'check_circle',
      type: 'confirmacion',
      title: 'NOTIFICATIONS.STATUS_UPDATE',
      desc: 'NOTIFICATIONS.STATUS_UPDATE_DESC',
      date: '2025-03-11',
      time: '14:30',
      read: true
    },
    {
      id: 3,
      icon: 'warning',
      type: 'cancelacion',
      title: 'NOTIFICATIONS.CANCELLATION',
      desc: 'NOTIFICATIONS.CANCELLATION_DESC',
      date: '2025-03-10',
      time: '10:00',
      read: false
    },
    {
      id: 4,
      icon: 'chat',
      type: 'mensaje',
      title: 'NOTIFICATIONS.CLIENT_MESSAGE',
      desc: 'NOTIFICATIONS.CLIENT_MESSAGE_DESC',
      date: '2025-03-04',
      time: '16:45',
      read: true
    },
    {
      id: 5,
      icon: 'desktop_windows',
      type: 'sistema',
      title: 'NOTIFICATIONS.SYSTEM',
      desc: 'NOTIFICATIONS.SYSTEM_DESC',
      date: '2025-03-08',
      time: '08:00',
      read: true
    }
  ];

}