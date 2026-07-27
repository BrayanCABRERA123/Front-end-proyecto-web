import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsComponent } from '../../../../shared/components/notifications/notifications';
import { OperatorNotificationsViewModel } from './notifications.viewmodel';

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
  providers: [OperatorNotificationsViewModel],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class OperatorNotificationsComponent implements OnInit {

  constructor(public vm: OperatorNotificationsViewModel) {}

  ngOnInit(): void {
    this.vm.cargar();
  }
}