import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingApiService } from '../../core/services/booking-api';
import { PreferencesService } from '../../core/services/preferences';
import { FeedbackService } from '../dialogs/feedback.service';
import { SettingsViewModel } from './settings.viewmodel';

describe('SettingsViewModel', () => {
  const bookingApi = { establishment: vi.fn(), businessHours: vi.fn() };
  const preferences = {
    currentTheme: vi.fn(), currentLanguage: vi.fn(), change: vi.fn(),
    notificationChannels: vi.fn(), saveNotificationChannels: vi.fn(),
  };
  const feedback = { error: vi.fn() };
  const translate = { instant: (key: string) => key.split('.').pop() };

  beforeEach(() => {
    [bookingApi, preferences, feedback].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    preferences.currentTheme.mockReturnValue('pink');
    preferences.currentLanguage.mockReturnValue('en');
    preferences.notificationChannels.mockReturnValue(of({ push: true, email: false, promo: true }));
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: bookingApi },
        { provide: PreferencesService, useValue: preferences },
        { provide: FeedbackService, useValue: feedback },
        { provide: TranslateService, useValue: translate },
        SettingsViewModel,
      ],
    });
  });

  it('muestra lo elegido y cambia el tema sin tocar el idioma', () => {
    const vm = TestBed.inject(SettingsViewModel);
    vm.load();

    expect(vm.channels()).toEqual({ push: true, email: false, promo: true });
    vm.changeTheme('green-dark');

    expect(vm.theme()).toBe('green-dark');
    expect(preferences.change).toHaveBeenCalledWith('green-dark', 'en', true);
  });

  it('si no se pudo guardar un interruptor, avisa y vuelve a lo que quedó guardado', () => {
    preferences.saveNotificationChannels.mockReturnValue(throwError(() => new Error('sin red')));
    const vm = TestBed.inject(SettingsViewModel);
    vm.load();

    vm.setChannel('email', true);

    expect(preferences.saveNotificationChannels).toHaveBeenCalledWith({ push: true, email: true, promo: true });
    expect(feedback.error).toHaveBeenCalledWith('COMMON.ERROR', 'CONFIG.NOTIFICATIONS_SAVE_ERROR');
    expect(vm.channels().email).toBe(false);
  });

  it('el Centro de ayuda arma el horario con los días de la sede si el admin no escribió uno', () => {
    bookingApi.establishment.mockReturnValue(of({ address: 'Calle 1', supportLine: '', phone: '6011234', email: 'sede@gmail.com', serviceHoursNote: '' }));
    bookingApi.businessHours.mockReturnValue(of([{ dayOfWeek: 1, working: true, openTime: '08:00:00', closeTime: '17:00:00' }]));
    const vm = TestBed.inject(SettingsViewModel);
    const show = vi.fn();

    vm.helpCenter(show);

    const info = show.mock.calls[0][0];
    expect(info.phone).toBe('6011234');
    expect(info.hours).toContain('monday');
  });
});
