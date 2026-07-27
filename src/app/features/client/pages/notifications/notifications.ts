import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications';
import { ClientNotificationsViewModel } from './notifications.viewmodel';

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, NotificationsComponent],
  providers: [ClientNotificationsViewModel],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class ClientNotificationsComponent implements OnInit {

  constructor(public vm: ClientNotificationsViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }
}