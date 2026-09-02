// modal para registrar un pago manual
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// mismos valores que MetodoPago en payments.ts, para no duplicar tipos incompatibles
export type MetodoPago = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'CASH';

// forma de los datos que emite el modal al registrar un pago
export interface PagoManual {
  cliente: string;
  servicio: string;
  monto: number;
  metodoPago: MetodoPago;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-modal.html',
  styleUrl: './payment-modal.scss'
})
export class PaymentModalComponent {
  @Input() abierto = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() registrarPago = new EventEmitter<PagoManual>();

  readonly metodos: { value: MetodoPago; label: string }[] = [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
    { value: 'BANK_TRANSFER', label: 'Transferencia Bancaria' },
    { value: 'PAYPAL', label: 'PayPal' }
  ];

  form: PagoManual = this.formVacio();

  private formVacio(): PagoManual {
    return { cliente: '', servicio: '', monto: 0, metodoPago: 'CASH' };
  }

  onCancelar(): void {
    this.form = this.formVacio();
    this.cerrar.emit();
  }

  onSubmit(ngForm: NgForm): void {
    if (ngForm.invalid || this.form.monto <= 0) {
      Object.values(ngForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    this.registrarPago.emit({ ...this.form });
    this.form = this.formVacio();
    ngForm.resetForm();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancelar();
    }
  }
}
