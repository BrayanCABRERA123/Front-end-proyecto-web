import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent, AppNotification } from '../../../../shared/components/notifications/notifications';
import { Api } from '../../../../core/services/api';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, NotificationsComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class ClientNotificationsComponent implements OnInit {

  notifications: AppNotification[] = [];

  // id del cliente logueado; 2 (Juan Díaz) es el demo por defecto si nadie inició sesión
  private get userId(): number {
    return this.auth.getCurrentUser()?.id ?? 2;
  }

  constructor(private api: Api, private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getNotifications(this.userId).subscribe(notifications => {
      this.notifications = notifications;
      this.cdr.detectChanges();
    });
  }

}