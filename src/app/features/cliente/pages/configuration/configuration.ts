import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../../../layout/sidebar/sidebar';
import { SettingsPanelComponent } from '../../../../shared/components/settings-panel/settings-panel';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    SettingsPanelComponent
  ],
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss'
})
export class ConfigurationComponent {

}