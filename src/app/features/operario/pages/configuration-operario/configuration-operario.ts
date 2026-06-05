import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { SettingsPanelComponent } from '../../../../shared/components/settings-panel/settings-panel';

@Component({
  selector: 'app-configuration-operario',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    SettingsPanelComponent
  ],
  templateUrl: './configuration-operario.html',
  styleUrl: './configuration-operario.scss'
})
export class ConfigurationOperarioComponent {

}