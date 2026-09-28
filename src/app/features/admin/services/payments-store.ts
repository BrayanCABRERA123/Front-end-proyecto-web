import { Injectable, computed, signal } from '@angular/core';

import { readStorage, writeStorage } from '../../../core/services/local-storage';
import { Payment, PaymentStatus } from '../models/admin.models';

const STORAGE_KEY = 'adminPayments';

/** fecha ISO (yyyy-MM-dd) con la cantidad de días indicada respecto a hoy */
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** fecha legible d/m/aaaa */
export function formatPaymentDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const SEED: Omit<Payment, 'id'>[] = [
  {
    code: '#PAG-4902', client: 'Sofía Castro Gómez', phone: '+57 318 720 1984', reference: 'NQ-8841920', method: 'nequi',
    amount: 85000, date: isoDate(), time: '14:48', service: 'Premium Especial (SUV)', status: 'pending',
    bookingCode: '#RES-8921', vehicle: 'Mazda CX-30', plate: 'NQ-4412', scheduleLabel: '15:00 - 16:00 (1 hora)',
    bay: 'Bahía 3', operator: 'Carlos Ruiz', email: 'sofia.castro@example.com', bankAccount: '312 490 8821', amountDeclared: 85000,
  },
  {
    code: '#PAG-4901', client: 'Juan Felipe Cárdenas', phone: '+57 311 405 8291', reference: 'TR-5541092', method: 'bancolombia',
    amount: 120000, date: isoDate(), time: '13:30', service: 'Detallado Cerámico', status: 'approved',
    bookingCode: '#RES-8917', vehicle: 'Audi A4 Sedán', plate: 'KLL-302', scheduleLabel: '13:00 - 14:30 (1.5 horas)',
    bay: 'Bahía 1', operator: 'Sofía Valencia', email: 'juan.cardenas@example.com', bankAccount: '901.482.930-1', amountDeclared: 120000,
  },
  {
    code: '#PAG-4900', client: 'Diego Herrera Rivas', phone: '+57 320 882 1104', reference: 'DV-9018442', method: 'daviplata',
    amount: 65000, date: isoDate(), time: '12:15', service: 'Lavado Básico', status: 'pending',
    bookingCode: '#RES-8919', vehicle: 'Toyota Hilux', plate: 'THX-780', scheduleLabel: '12:00 - 12:45 (45 min)',
    bay: 'Bahía 2', operator: 'Andrés Mora', email: 'diego.herrera@example.com', bankAccount: '320 882 1104', amountDeclared: 65000,
  },
  {
    code: '#PAG-4899', client: 'Esneider Sánchez', phone: '+57 301 649 0182', reference: 'EF-1003491', method: 'cash',
    amount: 45000, date: isoDate(), time: '11:20', service: 'Lavado Moto Especial', status: 'approved',
    bookingCode: '#RES-8905', vehicle: 'Yamaha FZ', plate: 'MKO-119', scheduleLabel: '11:00 - 11:30 (30 min)',
    bay: 'Bahía 4', operator: 'Juan Díaz', email: 'esneider.sanchez@example.com', bankAccount: '—', amountDeclared: 45000,
  },
  {
    code: '#PAG-4898', client: 'Carolina Vega Londoño', phone: '+57 315 229 4431', reference: 'TR-9901421', method: 'bancolombia',
    amount: 90000, date: isoDate(), time: '10:05', service: 'Encerado + Aspirado', status: 'rejected',
    rejectionReason: 'El monto declarado no coincide con la tarifa oficial del servicio.',
    bookingCode: '#RES-8916', vehicle: 'Kia Sportage', plate: 'BHY-209', scheduleLabel: '09:45 - 10:45 (1 hora)',
    bay: 'Bahía 1', operator: 'Camilo Restrepo', email: 'carolina.vega@example.com', bankAccount: '901.482.930-1', amountDeclared: 75000,
  },
  {
    code: '#PAG-4897', client: 'Óscar Rueda Mejía', phone: '+57 320 331 2281', reference: 'NQ-8855003', method: 'nequi',
    amount: 165000, date: isoDate(-1), time: '18:05', service: 'Detallado Completo Camioneta', status: 'approved',
    bookingCode: '#RES-8908', vehicle: 'Hyundai Tucson', plate: 'LPP-778', scheduleLabel: '16:30 - 18:00 (1.5 horas)',
    bay: 'Bahía 3', operator: 'Sofía Valencia', email: 'oscar.rueda@example.com', bankAccount: '302 667 4410', amountDeclared: 165000,
  },
  {
    code: '#PAG-4896', client: 'Natalia Cárdenas', phone: '+57 313 556 8890', reference: 'DV-9018449', method: 'daviplata',
    amount: 45000, date: isoDate(-1), time: '09:12', service: 'Lavado Básico', status: 'pending',
    bookingCode: '#RES-8911', vehicle: 'Renault Logan', plate: 'DFT-247', scheduleLabel: '09:00 - 09:40 (40 min)',
    bay: 'Bahía 2', operator: 'Carlos Ruiz', email: 'natalia.cardenas@example.com', bankAccount: '313 556 8890', amountDeclared: 45000,
  },
];

/**
 * Fuente única de datos de los pagos del administrador.
 *
 * La pantalla de pagos y el dashboard leen de aquí, así que aprobar o rechazar
 * un pago se refleja en las estadísticas sin recargar. Al conectar el backend se
 * sustituye el cuerpo de los métodos por llamadas HTTP manteniendo las firmas.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsStore {

  private readonly state = signal<Payment[]>(this.load());

  readonly payments = computed(() =>
    [...this.state()].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  );

  /** pagos pendientes de revisión (los usa el dashboard) */
  readonly pendingPayments = computed(() =>
    this.payments().filter(p => p.status === 'pending')
  );

  readonly rejectedCount = computed(() =>
    this.payments().filter(p => p.status === 'rejected').length
  );

  get today(): string {
    return isoDate();
  }

  getById(id: string): Payment | undefined {
    return this.state().find(p => p.id === id);
  }

  addManualPayment(value: ManualPaymentInput): Payment {
    const payment: Payment = {
      id: 'p-' + Date.now(),
      code: this.nextCode(),
      client: value.client,
      phone: '—',
      reference: 'MANUAL-' + Date.now().toString().slice(-6),
      method: value.method,
      amount: value.amount,
      date: isoDate(),
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      service: value.service,
      status: 'approved',
      bookingCode: '—',
      vehicle: '—',
      plate: '—',
      scheduleLabel: '—',
      bay: '—',
      operator: '—',
      email: '—',
      bankAccount: '—',
      amountDeclared: value.amount,
    };

    this.commit([payment, ...this.state()]);
    return payment;
  }

  /** resultado de la revisión hecha en el modal: aprobar o rechazar */
  review(id: string, status: 'approved' | 'rejected', reason?: string): void {
    this.commit(
      this.state().map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          status,
          rejectionReason: status === 'rejected' ? reason : undefined,
        };
      })
    );
  }

  /** apruébame el siguiente código libre del tipo #PAG-#### */
  nextCode(): string {
    const numbers = this.state()
      .map(p => Number(p.code.replace(/\D/g, '')))
      .filter(n => !Number.isNaN(n));
    return '#PAG-' + (numbers.length ? Math.max(...numbers) + 1 : 4900);
  }

  private commit(payments: Payment[]): void {
    this.state.set(payments);
    writeStorage(STORAGE_KEY, payments);
  }

  private load(): Payment[] {
    const stored = readStorage<Payment[] | null>(STORAGE_KEY, null);
    if (stored?.length) return stored;
    return SEED.map(p => ({ ...p, id: 'p-' + p.code.replace(/\D/g, '') }));
  }
}

/** forma que recibe la tienda al registrar un pago manual desde el modal */
export interface ManualPaymentInput {
  client: string;
  amount: number;
  service: string;
  method: Payment['method'];
}

// reexportamos el tipo de estado para que las pantallas no importen el modelo aparte
export type { Payment, PaymentStatus };