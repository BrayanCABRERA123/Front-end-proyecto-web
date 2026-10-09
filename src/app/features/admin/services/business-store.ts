import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import { BusinessData, PaymentMethodConfig } from '../models/admin.models';

const STORAGE_KEY = 'adminBusiness';

const DEFAULT_BUSINESS: BusinessData = {
  legalName: 'Express Car Wash S.A.S.',
  taxId: '901.482.930-1',
  businessType: 'Lavado y Detailing Automotriz',
  foundationDate: '2019-03-15',
  legalRep: 'Laura Méndez Ríos',
  legalRepDoc: 'CC 1.032.456.789',

  address: 'Calle 127 #19A-48, Bogotá, Colombia',
  phone: '+57 312 490 8821',
  email: 'contacto@expresscarwash.co',
  website: 'www.expresscarwash.co',

  taxRegime: 'Responsable de IVA 19% · Régimen Ordinario Común',
  ciiuActivity: '4520 - Mantenimiento y reparación de vehículos',
  dianResolution: 'No. 18764002345678',
  invoicePrefix: 'LV',
  invoiceRange: '4500-5500',

  instagram: '@expresscarwash_oficial',
  facebook: 'Express Car Wash S.A.S.',
  supportLine: '018000-123-456',
  serviceHours: 'Lunes a sábado 7:00 AM - 6:30 PM',
};

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'm1', name: 'Nequi', type: 'wallet', holder: 'Express Car Wash S.A.S.', accountNumber: '312 490 8821', active: true, needsQr: true, qrFileName: 'qr-nequi.png' },
  { id: 'm2', name: 'Bancolombia', type: 'bank', holder: 'Express Car Wash S.A.S.', accountNumber: '901.482.930-1', active: true, needsQr: true, qrFileName: 'qr-bancolombia.png' },
  { id: 'm3', name: 'DaviPlata', type: 'wallet', holder: 'Express Car Wash S.A.S.', accountNumber: '320 882 1104', active: false, needsQr: true, qrFileName: 'qr-daviplata.png' },
];

interface BusinessState {
  business: BusinessData;
  paymentMethods: PaymentMethodConfig[];
  /** permite migrar los datos guardados cuando cambia la estructura/valores semilla */
  version?: number;
}

/** sube cada vez que los datos por defecto cambian y lo guardado debe reajustarse */
const STORAGE_VERSION = 2;

/**
 * Datos de configuración del negocio (identidad, medios de pago y canales).
 * Pendiente de migrar a la API del negocio; mientras tanto persiste en
 * localStorage para que guardar y recargar conserve los cambios.
 */
@Injectable({ providedIn: 'root' })
export class BusinessStore {

  private readonly state = signal<BusinessState>(this.load());

  readonly business = computed(() => this.state().business);
  readonly paymentMethods = computed(() => this.state().paymentMethods);

  updateBusiness(changes: Partial<BusinessData>): void {
    this.update({ business: { ...this.state().business, ...changes } });
  }

  resetBusiness(): void {
    this.update({ business: { ...DEFAULT_BUSINESS } });
  }

  togglePaymentMethod(id: string): void {
    this.update({
      paymentMethods: this.state().paymentMethods.map(m =>
        m.id === id ? { ...m, active: !m.active } : m
      ),
    });
  }

  addPaymentMethod(value: Omit<PaymentMethodConfig, 'id' | 'active'>): PaymentMethodConfig {
    const method: PaymentMethodConfig = { ...value, id: 'm' + Date.now(), active: true };
    this.update({ paymentMethods: [...this.state().paymentMethods, method] });
    return method;
  }

  updatePaymentMethod(id: string, changes: Partial<Omit<PaymentMethodConfig, 'id'>>): void {
    this.update({
      paymentMethods: this.state().paymentMethods.map(m => (m.id === id ? { ...m, ...changes, id } : m)),
    });
  }

  removePaymentMethod(id: string): void {
    this.update({ paymentMethods: this.state().paymentMethods.filter(m => m.id !== id) });
  }

  private update(changes: Partial<BusinessState>): void {
    const next = { ...this.state(), ...changes };
    this.state.set(next);
    writeStorage(STORAGE_KEY, next);
  }

  private load(): BusinessState {
    const defaults: BusinessState = {
      business: DEFAULT_BUSINESS,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      version: STORAGE_VERSION,
    };

    const stored = readStorage<BusinessState | null>(STORAGE_KEY, null);
    if (!stored || !Array.isArray(stored.paymentMethods)) return defaults;

    let methods = stored.paymentMethods;
    const version = stored.version ?? 1;

    // v1 -> v2: Bancolombia volvió a requerir QR (y su archivo); los datos
    // guardados con el flag antiguo serían inconsistentes, así que se
    // reajustan al cargar.
    if (version < 2) {
      methods = methods.map(m =>
        m.id === 'm2'
          ? { ...m, needsQr: true, qrFileName: m.qrFileName ?? 'qr-bancolombia.png' }
          : m
      );
    }

    return {
      business: stored.business,
      paymentMethods: methods,
      version: STORAGE_VERSION,
    };
  }
}