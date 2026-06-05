import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class notificationsComponent {

  notifications = [
    {
      icon: 'event',
      title: 'NOTIFICATIONS.RESERVATION_CONFIRMED',
      desc: 'NOTIFICATIONS.RESERVATION_DESC',
      time: 'NOTIFICATIONS.TIME_2H'
    },
    {
      icon: 'notifications',
      title: 'NOTIFICATIONS.REMINDER',
      desc: 'NOTIFICATIONS.REMINDER_DESC',
      time: 'NOTIFICATIONS.TIME_1D'
    },
    {
      icon: 'card_giftcard',
      title: 'NOTIFICATIONS.PROMO',
      desc: 'NOTIFICATIONS.PROMO_DESC',
      time: 'NOTIFICATIONS.TIME_2D'
    },
    {
      icon: 'info',
      title: 'NOTIFICATIONS.UPDATE',
      desc: 'NOTIFICATIONS.UPDATE_DESC',
      time: 'NOTIFICATIONS.TIME_3D'
    }
  ];
}