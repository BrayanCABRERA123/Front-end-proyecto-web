import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarOperarioComponent } from '../../../../layout/sidebar-operario/sidebar-operario';
import { SettingsPanelComponent } from '../../../../shared/components/settings-panel/settings-panel';

@Component({
  selector: 'app-configuration-operario',
  standalone: true,
  imports: [
    CommonModule,
    SidebarOperarioComponent,
    SettingsPanelComponent
  ],
  templateUrl: './configuration-operario.html',
  styleUrl: './configuration-operario.scss'
})
export class ConfigurationOperarioComponent {

}