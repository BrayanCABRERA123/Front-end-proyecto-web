import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications';

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

  notifications = [
    {
      icon: 'event',
      title: 'NOTIFICATIONS.NEW_SERVICE',
      desc: 'NOTIFICATIONS.NEW_SERVICE_DESC',
      date: '12/03/2025 - 09:14',
      read: false
    },
    {
      icon: 'notifications',
      title: 'NOTIFICATIONS.STATUS_UPDATE',
      desc: 'NOTIFICATIONS.STATUS_UPDATE_DESC',
      date: '11/03/2025 - 14:30',
      read: true
    },
    {
      icon: 'warning',
      title: 'NOTIFICATIONS.CANCELLATION',
      desc: 'NOTIFICATIONS.CANCELLATION_DESC',
      date: '10/03/2025 - 10:00',
      read: false
    },
    {
      icon: 'chat',
      title: 'NOTIFICATIONS.CLIENT_MESSAGE',
      desc: 'NOTIFICATIONS.CLIENT_MESSAGE_DESC',
      date: '04/03/2025 - 16:45',
      read: true
    },
    {
      icon: 'desktop_windows',
      title: 'NOTIFICATIONS.SYSTEM',
      desc: 'NOTIFICATIONS.SYSTEM_DESC',
      date: '08/03/2025 - 08:00',
      read: true
    }
  ];

}