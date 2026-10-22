import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// dirección, teléfono y correo de la sede salen del booking-service (tabla booking.establishment,
// la edita el admin desde "Datos del negocio")
import { BookingApiService } from '../../core/services/booking-api';
import { BusinessHourDto } from '../../core/models/booking.models';
import { businessHoursSummary } from '../../core/utils/booking-display';
// tema, idioma e interruptores de notificaciones se guardan en la cuenta (security-service)
import { NotificationChannels, PreferencesService } from '../../core/services/preferences';
import { FeedbackService } from '../dialogs/feedback.service';

// canales de atención que muestra el Centro de ayuda
export interface HelpCenterInfo {
  address: string;
  phone: string | null;
  email: string | null;
  hours: string;
}

/** Configuración de cliente, operario y admin: notificaciones, tema, idioma y Centro de ayuda. */
@Injectable()
export class SettingsViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly preferences = inject(PreferencesService);
  private readonly feedback = inject(FeedbackService);
  private readonly translate = inject(TranslateService);

  // interruptores de notificaciones: load() los reemplaza por los de la cuenta. notification-service
  // los respeta (push, correo de recordatorios y promociones); la bandeja siempre se llena
  readonly channels = signal<NotificationChannels>({ push: true, email: true, promo: true });

  // el tema y el idioma ya se aplicaron al abrir la app; aquí solo se muestra cuál está elegido
  readonly theme = signal(this.preferences.currentTheme());
  readonly language = signal(this.preferences.currentLanguage());

  load(): void {
    this.loadChannels();
  }

  // guarda los interruptores en la cuenta cada vez que el usuario cambia uno; si falla, avisa y
  // vuelve a mostrar los que quedaron guardados
  setChannel(channel: keyof NotificationChannels, enabled: boolean): void {
    this.channels.update(current => ({ ...current, [channel]: enabled }));
    this.preferences.saveNotificationChannels(this.channels()).subscribe({
      next: saved => this.channels.set(saved),
      error: () => {
        this.feedback.error('COMMON.ERROR', 'CONFIG.NOTIFICATIONS_SAVE_ERROR');
        this.loadChannels();
      }
    });
  }

  changeTheme(theme: string): void {
    this.theme.set(theme);
    this.preferences.change(theme, this.language(), true);
  }

  changeLanguage(language: string): void {
    this.language.set(language);
    this.preferences.change(this.theme(), language, true);
  }

  // línea de atención y horario salen de los datos del negocio (Configuración del admin); si el
  // admin no escribió el horario se arma con el horario semanal de la sede
  helpCenter(show: (info: HelpCenterInfo) => void): void {
    forkJoin({
      location: this.bookingApi.establishment(),
      // sin el horario igual se abre el centro de ayuda
      hours: this.bookingApi.businessHours().pipe(catchError(() => of([] as BusinessHourDto[]))),
    }).subscribe({
      next: ({ location, hours }) => show({
        address: location.address,
        phone: location.supportLine || location.phone,
        email: location.email,
        hours: location.serviceHoursNote || this.hoursSummary(hours)
      }),
      error: () => show({ address: '—', phone: null, email: null, hours: '—' })
    });
  }

  // trae los interruptores de la cuenta (sin respuesta se quedan los valores por defecto)
  private loadChannels(): void {
    this.preferences.notificationChannels().subscribe({
      next: channels => this.channels.set(channels),
      error: () => undefined
    });
  }

  // días que abre la sede, en el idioma elegido (1 = lunes ... 7 = domingo)
  private hoursSummary(hours: BusinessHourDto[]): string {
    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return businessHoursSummary(hours, day => this.translate.instant('ADMIN_SCHEDULE.DAYS.' + keys[day - 1]));
  }
}
