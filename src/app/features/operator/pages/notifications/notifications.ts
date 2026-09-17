import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent, AppNotification } from '../../../../shared/components/notifications/notifications';
import { Api } from '../../../../core/services/api';

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

  notifications: AppNotification[] = [];

  private readonly operatorId = 1;

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getNotifications(this.operatorId).subscribe(notifications => {
      this.notifications = notifications;
      this.cdr.detectChanges();
    });
  }

}