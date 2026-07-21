import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications';

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, NotificationsComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class ClientNotificationsComponent {

  notifications = [
    {
      icon: 'event',
      title: 'NOTIFICATIONS.RESERVATION_CONFIRMED',
      desc: 'NOTIFICATIONS.RESERVATION_DESC',
      date: 'NOTIFICATIONS.TIME_2H',
      read: false
    },
    {
      icon: 'notifications',
      title: 'NOTIFICATIONS.REMINDER',
      desc: 'NOTIFICATIONS.REMINDER_DESC',
      date: 'NOTIFICATIONS.TIME_1D',
      read: false
    },
    {
      icon: 'card_giftcard',
      title: 'NOTIFICATIONS.PROMO',
      desc: 'NOTIFICATIONS.PROMO_DESC',
      date: 'NOTIFICATIONS.TIME_2D',
      read: true
    },
    {
      icon: 'info',
      title: 'NOTIFICATIONS.UPDATE',
      desc: 'NOTIFICATIONS.UPDATE_DESC',
      date: 'NOTIFICATIONS.TIME_3D',
      read: true
    }
  ];

}