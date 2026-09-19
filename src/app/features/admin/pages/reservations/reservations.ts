import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ComingSoonComponent } from '../../../../shared/components/coming-soon/coming-soon';


@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, TranslateModule, SidebarComponent, ComingSoonComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss'
})
export class ReservationsComponent {}
