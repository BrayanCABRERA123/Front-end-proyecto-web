import { Injectable, computed, inject, signal } from '@angular/core';
import QRCode from 'qrcode';

import { AppReleaseService, PublishedApk } from '../../../core/services/app-release';
import { BookingApiService } from '../../../core/services/booking-api';

// tipo de vehículo de referencia para el precio "desde" (1 = automóvil en customer-service)
const REFERENCE_VEHICLE_TYPE = 1;

// reutiliza las claves SERVICE.* que ya existen en los JSON de idiomas
const PLANS = [
  {
    anchorId: 'service-basic',
    icon: 'local_car_wash',
    nameKey: 'SERVICE.BASIC',
    descKey: 'SERVICE.BASIC_DESC',
    code: 'BASIC',
    timeKey: 'SERVICE.BASIC_TIME',
    itemsKey: 'SERVICE.BASIC_ITEMS',
    popular: false
  },
  {
    anchorId: 'service-premium',
    icon: 'workspace_premium',
    nameKey: 'SERVICE.PREMIUM',
    descKey: 'SERVICE.PREMIUM_DESC',
    code: 'PREMIUM',
    timeKey: 'SERVICE.PREMIUM_TIME',
    itemsKey: 'SERVICE.PREMIUM_ITEMS',
    popular: true
  },
  {
    anchorId: 'service-full',
    icon: 'auto_awesome',
    nameKey: 'SERVICE.FULL',
    descKey: 'SERVICE.FULL_DESC',
    code: 'FULL',
    timeKey: 'SERVICE.FULL_TIME',
    itemsKey: 'SERVICE.FULL_ITEMS',
    popular: false
  }
];

/**
 * Página pública: precios de los planes, datos de contacto del negocio y la descarga de la app.
 * Lo comparten la página y sus secciones; si el backend no responde, cada sección queda vacía.
 */
@Injectable()
export class LandingViewModel {

  private readonly bookingApi = inject(BookingApiService);
  private readonly releases = inject(AppReleaseService);

  // precios reales del catálogo, emparejados por código del servicio
  private readonly prices = signal<Record<string, number | null>>({});
  readonly plans = computed(() => PLANS.map(plan => ({ ...plan, price: this.prices()[plan.code] ?? null })));

  // correo, teléfono y dirección del negocio que el admin guarda en Configuración (booking-service)
  private readonly email = signal('—');
  private readonly phone = signal('—');
  private readonly address = signal('—');
  readonly contactCards = computed(() => [
    { icon: 'mail', labelKey: 'CONTACT.EMAIL_LABEL', value: this.email() },
    { icon: 'call', labelKey: 'CONTACT.PHONE_LABEL', value: this.phone() },
    { icon: 'location_on', labelKey: 'CONTACT.ADDRESS_LABEL', value: this.address() }
  ]);

  // APK publicado: sin él la sección de descarga no aparece (ej. desarrollo local)
  readonly apk = signal<PublishedApk | null>(null);
  readonly downloadUrl = signal('');
  readonly qrDataUrl = signal('');
  readonly sizeLabel = computed(() => {
    const bytes = this.apk()?.sizeBytes;
    return bytes ? `${Math.round(bytes / (1024 * 1024))} MB` : '';
  });

  load(): void {
    this.loadPrices();
    this.loadContact();
    this.loadApk();
  }

  private loadPrices(): void {
    this.bookingApi.services(REFERENCE_VEHICLE_TYPE).subscribe({
      next: services => this.prices.set(Object.fromEntries(
        PLANS.map(plan => [plan.code, services.find(s => s.code === plan.code)?.prices[0]?.price ?? null])
      )),
      error: () => undefined // sin backend la tarjeta muestra el precio vacío
    });
  }

  private loadContact(): void {
    this.bookingApi.establishment().subscribe({
      next: business => {
        this.email.set(business.email || '—');
        this.phone.set(business.phone || business.supportLine || '—');
        this.address.set(business.address || '—');
      },
      error: () => undefined // sin backend las tarjetas quedan con '—'
    });
  }

  private loadApk(): void {
    this.releases.latestApk().subscribe({
      next: apk => {
        if (!apk?.url) return;
        // dirección completa: el QR se escanea desde otro dispositivo
        const url = new URL(apk.url, window.location.origin).toString();
        this.apk.set(apk);
        this.downloadUrl.set(url);
        QRCode.toDataURL(url, { width: 220, margin: 1 })
          .then(dataUrl => this.qrDataUrl.set(dataUrl))
          .catch(() => undefined);
      },
      // sin APK publicado no se muestra la sección
      error: () => undefined
    });
  }
}
