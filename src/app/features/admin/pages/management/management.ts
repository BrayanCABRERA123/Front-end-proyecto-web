// contenedor principal del panel de gestión: agrupa usuarios, roles, servicios, promociones y operativo
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { UsersComponent } from './users/users';
import { RolesComponent } from './roles/roles';
import { ServicesComponent } from './services/services';
import { PromotionsComponent } from './promotions/promotions';
import { OperationalComponent } from './operational/operational';

// pestañas disponibles dentro del panel
type TabGestion = 'USERS' | 'ROLES' | 'SERVICES' | 'PROMOTIONS' | 'OPERATIONAL';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, TranslateModule,
    SidebarComponent, UsersComponent, RolesComponent,
    ServicesComponent, PromotionsComponent, OperationalComponent
  ],
  templateUrl: './management.html',
  styleUrls: ['./management.scss']
})
export class ManagementComponent {
  tabActiva: TabGestion = 'USERS';

  cambiarTab(tab: TabGestion): void {
    this.tabActiva = tab;
  }
}
