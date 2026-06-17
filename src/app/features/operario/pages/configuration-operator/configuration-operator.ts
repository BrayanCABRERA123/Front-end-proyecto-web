import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { SettingsPanelComponent } from '../../../../shared/components/settings-panel/settings-panel';

@Component({
  selector: 'app-configuration-operator',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    SettingsPanelComponent
  ],
  templateUrl: './configuration-operator.html',
  styleUrl: './configuration-operator.scss'
})
export class ConfigurationOperatorComponent {

}