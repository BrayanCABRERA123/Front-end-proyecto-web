import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { UsersComponent } from './users/users';
import { RolesComponent } from './roles/roles';

type TabSeguridad = 'USERS' | 'ROLES';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, SidebarComponent, UsersComponent, RolesComponent],
  templateUrl: './security.html',
  styleUrls: ['./security.scss']
})
export class SecurityComponent {
  tabActiva: TabSeguridad = 'USERS';

  cambiarTab(tab: TabSeguridad): void {
    this.tabActiva = tab;
  }
}
