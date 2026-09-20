import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { PaymentModalComponent, ManualPaymentResult } from './components/payment-modal/payment-modal';
import { PaymentReviewModal } from '../../../../shared/dialogs/payment-review-modal/payment-review-modal';
import { PaymentMethod, PaymentReviewData, PaymentReviewResult } from '../../../../shared/dialogs/payment-review-modal/payment-review.model';

type PaymentStatus = 'pending' | 'approved' | 'rejected';

interface Payment {
  code: string;
  client: string;
  phone: string;
  reference: string;
  method: PaymentMethod;
  amount: number;
  date: string;
  time: string;
  service: string;
  status: PaymentStatus;
  rejectionReason?: string;

  // detalle extra que solo se usa al abrir el modal de revisión
  bookingCode: string;
  vehicle: string;
  plate: string;
  scheduleLabel: string;
  bay: string;
  operator: string;
  email: string;
  bankAccount: string;
  amountDeclared: number;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, MatIconModule, TranslateModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})
export class PaymentsComponent {

  search = '';
  methodFilter = '';
  statusFilter: PaymentStatus | '' = '';

  payments: Payment[] = [
    {
      code: '#PAG-4902', client: 'Sofía Castro Gómez', phone: '+57 318 720 1984', reference: 'NQ-8841920', method: 'nequi',
      amount: 85000, date: 'Hoy', time: '14:48', service: 'Premium Especial (SUV)', status: 'pending',
      bookingCode: '#RES-8921', vehicle: 'Mazda CX-30', plate: 'NQ-4412', scheduleLabel: 'Hoy, 15:00 - 16:00 (1 hora)',
      bay: 'Bahía 3', operator: 'Carlos Ruiz', email: 'sofia.castro@example.com', bankAccount: '312 490 8821', amountDeclared: 85000
    },
    {
      code: '#PAG-4901', client: 'Juan Felipe Cárdenas', phone: '+57 311 405 8291', reference: 'TR-5541092', method: 'bancolombia',
      amount: 120000, date: 'Hoy', time: '13:30', service: 'Detallado Cerámico', status: 'approved',
      bookingCode: '#RES-8917', vehicle: 'Audi A4 Sedán', plate: 'KLL-302', scheduleLabel: 'Hoy, 13:00 - 14:30 (1.5 horas)',
      bay: 'Bahía 1', operator: 'Sofía Valencia', email: 'juan.cardenas@example.com', bankAccount: '901.482.930-1', amountDeclared: 120000
    },
    {
      code: '#PAG-4900', client: 'Diego Herrera Rivas', phone: '+57 320 882 1104', reference: 'DV-9018442', method: 'daviplata',
      amount: 65000, date: 'Hoy', time: '12:15', service: 'Lavado Básico', status: 'pending',
      bookingCode: '#RES-8919', vehicle: 'Toyota Hilux', plate: 'THX-780', scheduleLabel: 'Hoy, 12:00 - 12:45 (45 min)',
      bay: 'Bahía 2', operator: 'Andrés Mora', email: 'diego.herrera@example.com', bankAccount: '320 882 1104', amountDeclared: 65000
    },
    {
      code: '#PAG-4899', client: 'Esneider Sánchez', phone: '+57 301 649 0182', reference: 'EF-1003491', method: 'cash',
      amount: 45000, date: 'Hoy', time: '11:20', service: 'Lavado Moto Especial', status: 'approved',
      bookingCode: '#RES-8905', vehicle: 'Yamaha FZ', plate: 'MKO-119', scheduleLabel: 'Hoy, 11:00 - 11:30 (30 min)',
      bay: 'Bahía 4', operator: 'Juan Díaz', email: 'esneider.sanchez@example.com', bankAccount: '—', amountDeclared: 45000
    },
    {
      code: '#PAG-4898', client: 'Carolina Vega Londoño', phone: '+57 315 229 4431', reference: 'TR-9901421', method: 'bancolombia',
      amount: 90000, date: 'Hoy', time: '10:05', service: 'Encerado + Aspirado', status: 'rejected',
      rejectionReason: 'El monto declarado no coincide con la tarifa oficial del servicio.',
      bookingCode: '#RES-8916', vehicle: 'Kia Sportage', plate: 'BHY-209', scheduleLabel: 'Hoy, 09:45 - 10:45 (1 hora)',
      bay: 'Bahía 1', operator: 'Camilo Restrepo', email: 'carolina.vega@example.com', bankAccount: '901.482.930-1', amountDeclared: 75000
    },
  ];

  constructor(private dialog: MatDialog) {}

  get filteredPayments(): Payment[] {
    const term = this.search.trim().toLowerCase();

    return this.payments
      .filter(p => !this.methodFilter || p.method === this.methodFilter)
      .filter(p => !this.statusFilter || p.status === this.statusFilter)
      .filter(p => !term
        || p.client.toLowerCase().includes(term)
        || p.reference.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term));
  }

  get stats() {
    const approved = this.payments.filter(p => p.status === 'approved');

    return {
      pending: this.payments.filter(p => p.status === 'pending').length,
      approvedToday: approved.length,
      approvedAmount: approved.reduce((sum, p) => sum + p.amount, 0),
      rejected: this.payments.filter(p => p.status === 'rejected').length,
      totalCollected: approved.reduce((sum, p) => sum + p.amount, 0),
      transactionsCount: this.payments.length,
    };
  }

  clearFilters(): void {
    this.search = '';
    this.methodFilter = '';
    this.statusFilter = '';
  }

  // formatea a pesos colombianos, ej: $85.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  // --- registro manual ---

  openManualModal(): void {
    const dialogRef = this.dialog.open(PaymentModalComponent, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: ManualPaymentResult | null) => {
      if (result) this.onManualPaymentRegistered(result);
    });
  }

  private onManualPaymentRegistered(result: ManualPaymentResult): void {
    this.payments = [
      {
        code: '#PAG-' + (4900 + this.payments.length),
        client: result.client,
        phone: '—',
        reference: 'MANUAL-' + Date.now().toString().slice(-6),
        method: result.method,
        amount: result.amount,
        date: 'Hoy',
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        service: result.service,
        status: 'approved',
        bookingCode: '—',
        vehicle: '—',
        plate: '—',
        scheduleLabel: '—',
        bay: '—',
        operator: '—',
        email: '—',
        bankAccount: '—',
        amountDeclared: result.amount
      },
      ...this.payments
    ];
  }

  // --- revisión de pago pendiente ---

  openReview(payment: Payment): void {
    const data: PaymentReviewData = {
      code: payment.code,
      status: payment.status,
      client: payment.client,
      phone: payment.phone,
      email: payment.email,
      bookingCode: payment.bookingCode,
      service: payment.service,
      vehicle: payment.vehicle,
      plate: payment.plate,
      scheduleLabel: payment.scheduleLabel,
      bay: payment.bay,
      operator: payment.operator,
      method: payment.method,
      transactionReference: payment.reference,
      amountDue: payment.amount,
      amountDeclared: payment.amountDeclared,
      receiptDate: `${payment.date}, ${payment.time} COT`,
      bankAccount: payment.bankAccount
    };

    const dialogRef = this.dialog.open(PaymentReviewModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: PaymentReviewResult | null) => {
      if (!result) return;

      if (result.action === 'approved') {
        payment.status = 'approved';
      } else {
        payment.status = 'rejected';
        payment.rejectionReason = result.reason;
      }
    });
  }

  // el motivo de rechazo también se muestra en un modal simple, reutilizando el mismo dialog en modo lectura
  viewRejectionReason(payment: Payment): void {
    this.openReview(payment);
  }
}
