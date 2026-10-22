import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';

import { TranslateModule } from '@ngx-translate/core';

// modal reutilizable para consultar Términos y Condiciones / Política de Datos
import { LegalDocumentModal, LegalDocumentType } from '../../dialogs/legal-document-modal/legal-document-modal';
// modal reutilizable que también muestra una lista de detalles (se usa como Centro de ayuda)
import { StatusModal, StatusModalData } from '../../dialogs/status-modal/status-modal';
import { HelpCenterInfo, SettingsViewModel } from '../../viewmodels/settings.viewmodel';

// panel de Configuración de los 3 roles: lo que se guarda en la cuenta está en SettingsViewModel
@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslateModule
  ],
  providers: [SettingsViewModel],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss'
})
export class SettingsPanelComponent implements OnInit {

  readonly vm = inject(SettingsViewModel);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.vm.load();
  }

  // abre el documento legal solo para consulta (sin botones de aceptación,
  // el usuario ya aceptó al registrarse)
  viewLegalDocument(type: LegalDocumentType): void {
    this.dialog.open(LegalDocumentModal, {
      panelClass: 'custom-dialog',
      data: { type, mode: 'view' }
    });
  }

  // abre el Centro de ayuda con los canales de atención del lavadero
  openHelpCenter(): void {
    this.vm.helpCenter(info => this.showHelpCenter(info));
  }

  private showHelpCenter({ address, phone, email, hours }: HelpCenterInfo): void {
    // las novedades del servicio le llegan al cliente por sus notificaciones y su correo
    const data: StatusModalData = {
      type: 'info',
      icon: 'support_agent',
      title: 'CONFIG.HELP_CENTER',
      message: 'CONFIG.HELP_MODAL.MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'CONFIG.HELP_MODAL.SUPPORT_LINE', value: phone ?? '—' },
        { label: 'CONFIG.HELP_MODAL.EMAIL', value: email ?? '—' },
        { label: 'CONFIG.HELP_MODAL.HOURS', value: hours },
        { label: 'CONFIG.HELP_MODAL.ADDRESS', value: address }
      ]
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }
}
