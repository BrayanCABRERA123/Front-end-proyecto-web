import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ComingSoonComponent } from '../../../../shared/components/coming-soon/coming-soon';

// hub "Gestión": pestañas Usuarios / Roles / Servicios / Promociones
@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, TranslateModule, SidebarComponent, ComingSoonComponent],
  templateUrl: './management.html',
  styleUrl: './management.scss'
})
export class ManagementComponent {}
