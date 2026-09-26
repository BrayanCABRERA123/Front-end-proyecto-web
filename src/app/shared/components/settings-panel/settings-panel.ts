import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

// modal reutilizable para consultar Términos y Condiciones / Política de Datos
import { LegalDocumentModal, LegalDocumentType } from '../../dialogs/legal-document-modal/legal-document-modal';
// modal reutilizable que también muestra una lista de detalles (se usa como Centro de ayuda)
import { StatusModal, StatusModalData } from '../../dialogs/status-modal/status-modal';
// datos de contacto y sede del lavadero
import { BUSINESS_CONTACT } from '../../../core/constants/business-contact';
import { BUSINESS_LOCATION } from '../../../core/constants/business-location';

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
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss'
})
export class SettingsPanelComponent implements OnInit {

  settings = {
    push: true,
    email: true,
    promo: false
  };

  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog
  ) {
    this.translate.addLangs(['es', 'en', 'fr', 'pt']);
    this.translate.setDefaultLang('es');
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
    const data: StatusModalData = {
      type: 'info',
      icon: 'support_agent',
      title: 'CONFIG.HELP_CENTER',
      message: 'CONFIG.HELP_MODAL.MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'CONFIG.HELP_MODAL.WHATSAPP', value: BUSINESS_CONTACT.whatsapp },
        { label: 'CONFIG.HELP_MODAL.SUPPORT_LINE', value: BUSINESS_CONTACT.supportLine },
        { label: 'CONFIG.HELP_MODAL.EMAIL', value: BUSINESS_CONTACT.email },
        { label: 'CONFIG.HELP_MODAL.HOURS', value: this.translate.instant('CONFIG.HELP_MODAL.HOURS_VALUE') },
        { label: 'CONFIG.HELP_MODAL.ADDRESS', value: BUSINESS_LOCATION.address }
      ]
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }

  ngOnInit(): void {

    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('lang');

    if (savedTheme) {
      this.selectedTheme = savedTheme;
      this.applyTheme(savedTheme);
    }

    if (savedLang) {
      this.selectedLanguage = savedLang;
      this.translate.use(savedLang);
    }
  }

  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  applyTheme(theme: string): void {

    const themes = [
      'green-light',
      'green-dark',
      'pink',
      'pink-dark'
    ];

    document.body.classList.remove(...themes);

    document.body.classList.add(theme);
  }

  changeLanguage(lang: string): void {

    this.selectedLanguage = lang;

    this.translate.use(lang);

    localStorage.setItem('lang', lang);
  }

}