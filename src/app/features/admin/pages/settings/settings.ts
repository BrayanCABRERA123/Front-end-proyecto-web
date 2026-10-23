import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { SettingsPanelComponent } from '../../../../shared/components/settings-panel/settings-panel';
import { BusinessDataComponent } from './components/business-data/business-data';
import { PaymentMethodsComponent } from './components/payment-methods/payment-methods';

type SettingsTab = 'general' | 'business' | 'payments';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    SidebarComponent,
    SettingsPanelComponent,
    BusinessDataComponent,
    PaymentMethodsComponent
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class AdminSettingsComponent {

  activeTab: SettingsTab = 'general';

  tabs: { key: SettingsTab; icon: string; labelKey: string }[] = [
    { key: 'general', icon: 'tune', labelKey: 'ADMIN_SETTINGS.TABS.GENERAL' },
    { key: 'business', icon: 'domain', labelKey: 'ADMIN_SETTINGS.TABS.BUSINESS' },
    { key: 'payments', icon: 'payments', labelKey: 'ADMIN_SETTINGS.TABS.PAYMENTS' },
  ];

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
  }
}
