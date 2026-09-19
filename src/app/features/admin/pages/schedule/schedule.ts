import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ComingSoonComponent } from '../../../../shared/components/coming-soon/coming-soon';


@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, TranslateModule, SidebarComponent, ComingSoonComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent {}
