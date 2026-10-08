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
// dirección, teléfono y correo de la sede salen del booking-service (tabla booking.establishment,
// la edita el admin desde "Datos del negocio")
import { BookingApiService } from '../../../core/services/booking-api';
// tema e idioma se guardan en la cuenta (security-service), no solo en el navegador
import { PreferencesService } from '../../../core/services/preferences';

// llave donde se guardan las preferencias de notificaciones (igual que 'theme' y 'lang')
const NOTIFICATIONS_KEY = 'notificationSettings';

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

  // valores por defecto; en ngOnInit se reemplazan por los guardados
  settings = {
    push: true,
    email: true,
    promo: false
  };

  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private bookingApi: BookingApiService,
    private preferences: PreferencesService
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
    this.bookingApi.establishment().subscribe({
      next: (location) => this.showHelpCenter(location.address, location.phone, location.email),
      error: () => this.showHelpCenter('—', null, null)
    });
  }

  private showHelpCenter(address: string, phone: string | null, email: string | null): void {
    // el negocio solo tiene un teléfono en la base: lo mostramos como WhatsApp y como línea de
    // atención, porque son el mismo número en la vida real
    const data: StatusModalData = {
      type: 'info',
      icon: 'support_agent',
      title: 'CONFIG.HELP_CENTER',
      message: 'CONFIG.HELP_MODAL.MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
        { label: 'CONFIG.HELP_MODAL.WHATSAPP', value: phone ?? '—' },
        { label: 'CONFIG.HELP_MODAL.SUPPORT_LINE', value: phone ?? '—' },
        { label: 'CONFIG.HELP_MODAL.EMAIL', value: email ?? '—' },
        { label: 'CONFIG.HELP_MODAL.HOURS', value: this.translate.instant('CONFIG.HELP_MODAL.HOURS_VALUE') },
        { label: 'CONFIG.HELP_MODAL.ADDRESS', value: address }
      ]
    };

    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data
    });
  }

  // guarda los interruptores de notificaciones cada vez que el usuario cambia uno
  saveNotificationSettings(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(this.settings));
    } catch {
      // si el navegador no permite guardar, el cambio queda solo mientras la página esté abierta
    }
  }

  // carga los interruptores guardados (si no hay nada, se quedan los valores por defecto)
  private loadNotificationSettings(): void {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // si el valor guardado está dañado, se usan los valores por defecto
    }
  }

  ngOnInit(): void {

    this.loadNotificationSettings();

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
    this.preferences.change(theme, this.selectedLanguage || this.preferences.currentLanguage(), true);
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
    this.preferences.change(this.selectedTheme || this.preferences.currentTheme(), lang, true);
  }

}