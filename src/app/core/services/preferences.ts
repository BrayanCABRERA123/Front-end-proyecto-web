import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../constants/api';

// mismas paletas que acepta security-service (ck_pref_theme)
export const THEMES = ['green-light', 'green-dark', 'pink', 'pink-dark'] as const;
export type ThemeCode = typeof THEMES[number];

interface PreferencesDto {
  theme: string;
  language: string;
  notificationsEnabled: boolean;   // notificaciones push
  emailRemindersEnabled: boolean;  // correo de los recordatorios de reserva
  promotionsEnabled: boolean;      // promociones (cupones desbloqueados)
}

// interruptores de Configuración > Notificaciones. Se guardan en la cuenta (security-service) y
// notification-service los respeta al enviar: la pantalla solo los muestra y los cambia
export interface NotificationChannels {
  push: boolean;
  email: boolean;
  promo: boolean;
}

const toChannels = (prefs: PreferencesDto): NotificationChannels => ({
  push: prefs.notificationsEnabled,
  email: prefs.emailRemindersEnabled,
  promo: prefs.promotionsEnabled,
});

/**
 * Tema e idioma por cuenta (RF-019/020). Con sesión iniciada se guardan en security-service
 * (/users/me/preferences), así cada correo recupera los suyos al entrar aunque comparta el
 * navegador. localStorage solo recuerda la última elección para las pantallas sin sesión.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {

  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  // aplica lo guardado en el navegador (antes de iniciar sesión)
  applyLocal(): void {
    this.apply(localStorage.getItem('theme') || 'green-light', localStorage.getItem('lang') || 'es');
  }

  // trae las preferencias de la cuenta que acaba de entrar y las aplica
  loadForUser(): void {
    this.http.get<PreferencesDto>(`${API_BASE_URL}/users/me/preferences`).subscribe({
      next: prefs => this.apply(prefs.theme, prefs.language),
      error: () => undefined // si security no responde se queda lo local
    });
  }

  currentTheme(): string {
    return localStorage.getItem('theme') || 'green-light';
  }

  currentLanguage(): string {
    return localStorage.getItem('lang') || 'es';
  }

  // cambia y, si hay sesión, guarda en la cuenta. No manda los interruptores de notificaciones:
  // security-service los deja como estaban
  change(theme: string, language: string, saveInAccount: boolean): void {
    this.apply(theme, language);
    if (!saveInAccount) return;
    this.http.put<PreferencesDto>(`${API_BASE_URL}/users/me/preferences`, { theme, language })
      .subscribe({ error: () => undefined });
  }

  // interruptores de notificaciones de la cuenta con sesión
  notificationChannels(): Observable<NotificationChannels> {
    return this.http.get<PreferencesDto>(`${API_BASE_URL}/users/me/preferences`).pipe(map(toChannels));
  }

  // guarda los interruptores en la cuenta (cambio parcial: el tema y el idioma no se tocan)
  saveNotificationChannels(channels: NotificationChannels): Observable<NotificationChannels> {
    return this.http.put<PreferencesDto>(`${API_BASE_URL}/users/me/preferences`, {
      notificationsEnabled: channels.push,
      emailRemindersEnabled: channels.email,
      promotionsEnabled: channels.promo,
    }).pipe(map(toChannels));
  }

  private apply(theme: string, language: string): void {
    const safeTheme = (THEMES as readonly string[]).includes(theme) ? theme : 'green-light';
    document.body.classList.remove(...THEMES, 'light');
    document.body.classList.add(safeTheme);
    this.translate.use(language);
    localStorage.setItem('theme', safeTheme);
    localStorage.setItem('lang', language);
  }
}
