import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent, AppNotification } from '../../../../shared/components/notifications/notifications';
import { NotificationsService } from '../../../../core/services/notifications';

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
export class OperatorNotificationsComponent implements OnInit {

  // El mock API filtra por el usuario del JWT: cada rol ve solo sus notificaciones.
  notifications: AppNotification[] = [];

  constructor(
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notificationsService.myNotifications$().subscribe(notifications => {
      this.notifications = notifications;
      this.cdr.markForCheck();
    });
  }

}
