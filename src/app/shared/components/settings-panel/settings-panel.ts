import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
// tema, idioma e interruptores de notificaciones se guardan en la cuenta (security-service)
import { NotificationChannels, PreferencesService } from '../../../core/services/preferences';
import { FeedbackService } from '../../dialogs/feedback.service';

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

  // interruptores de notificaciones: en ngOnInit se reemplazan por los de la cuenta. notification-service
  // los respeta (push, correo de recordatorios y promociones); la bandeja siempre se llena
  settings: NotificationChannels = {
    push: true,
    email: true,
    promo: true
  };

  selectedTheme: string = 'green-light';
  selectedLanguage: string = 'es';

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private bookingApi: BookingApiService,
    private preferences: PreferencesService,
    private feedback: FeedbackService,
    private changes: ChangeDetectorRef
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
    // el negocio solo tiene un teléfono en la base: es la línea de atención. Las novedades del
    // servicio le llegan al cliente por sus notificaciones y su correo
    const data: StatusModalData = {
      type: 'info',
      icon: 'support_agent',
      title: 'CONFIG.HELP_CENTER',
      message: 'CONFIG.HELP_MODAL.MESSAGE',
      buttonText: 'COMMON.CLOSE',
      details: [
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

  // guarda los interruptores en la cuenta cada vez que el usuario cambia uno; si falla, avisa y
  // vuelve a mostrar los que quedaron guardados
  saveNotificationSettings(): void {
    this.preferences.saveNotificationChannels(this.settings).subscribe({
      next: saved => {
        this.settings = saved;
        this.changes.markForCheck();
      },
      error: () => {
        this.feedback.error('COMMON.ERROR', 'CONFIG.NOTIFICATIONS_SAVE_ERROR');
        this.loadNotificationSettings();
      }
    });
  }

  // trae los interruptores de la cuenta (sin respuesta se quedan los valores por defecto)
  private loadNotificationSettings(): void {
    this.preferences.notificationChannels().subscribe({
      next: channels => {
        this.settings = channels;
        this.changes.markForCheck();
      },
      error: () => undefined
    });
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