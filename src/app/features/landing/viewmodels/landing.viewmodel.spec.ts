import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AppReleaseService } from '../../../core/services/app-release';
import { BookingApiService } from '../../../core/services/booking-api';
import { LandingViewModel } from './landing.viewmodel';

describe('LandingViewModel', () => {
  const bookingApi = { services: vi.fn(), establishment: vi.fn() };
  const releases = { latestApk: vi.fn() };

  beforeEach(() => {
    [bookingApi, releases].forEach(m => Object.values(m).forEach(f => f.mockReset()));
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingApiService, useValue: bookingApi },
        { provide: AppReleaseService, useValue: releases },
        LandingViewModel,
      ],
    });
  });

  it('muestra los precios del catálogo, el contacto del negocio y la descarga publicada', () => {
    bookingApi.services.mockReturnValue(of([
      { code: 'BASIC', prices: [{ price: 25000 }] },
      { code: 'FULL', prices: [{ price: 60000 }] },
    ]));
    bookingApi.establishment.mockReturnValue(of({ email: 'sede@gmail.com', phone: '', supportLine: '3001234567', address: 'Calle 1' }));
    releases.latestApk.mockReturnValue(of({ versionCode: 7, url: '/app/LavaRapidoVehicular.apk', sizeBytes: 31457280 }));
    const vm = TestBed.inject(LandingViewModel);

    vm.load();

    expect(bookingApi.services).toHaveBeenCalledWith(1);
    expect(vm.plans().map(p => p.price)).toEqual([25000, null, 60000]);
    expect(vm.contactCards().map(c => c.value)).toEqual(['sede@gmail.com', '3001234567', 'Calle 1']);
    expect(vm.apk()?.versionCode).toBe(7);
    expect(vm.downloadUrl()).toBe(window.location.origin + '/app/LavaRapidoVehicular.apk');
    expect(vm.sizeLabel()).toBe('30 MB');
  });

  it('sin backend ni APK publicado deja los guiones y oculta la descarga', () => {
    bookingApi.services.mockReturnValue(throwError(() => new Error('sin red')));
    bookingApi.establishment.mockReturnValue(throwError(() => new Error('sin red')));
    releases.latestApk.mockReturnValue(throwError(() => new Error('404')));
    const vm = TestBed.inject(LandingViewModel);

    vm.load();

    expect(vm.plans().every(p => p.price === null)).toBe(true);
    expect(vm.contactCards().map(c => c.value)).toEqual(['—', '—', '—']);
    expect(vm.apk()).toBeNull();
  });
});
