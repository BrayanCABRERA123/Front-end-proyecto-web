// definimos el componente
import { Component, OnInit, inject, signal } from '@angular/core';
// para usar *ngFor y *ngIf en el HTML
import { CommonModule } from '@angular/common';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// iconos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar mensajes de éxito o error
import { StatusModal } from '../../../../shared/dialogs/status-modal/status-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { PaymentCouponComponent } from './components/payment-coupon/payment-coupon';
import { PaymentHelpComponent } from './components/payment-help/payment-help';
import { PaymentNoticeComponent } from './components/payment-notice/payment-notice';
import { PaymentMissingComponent } from './components/payment-missing/payment-missing';
import { PaymentQrZoomComponent } from './components/payment-qr-zoom/payment-qr-zoom';
import { PaymentViewModel } from '../../viewmodels/payment.viewmodel';

// vista del pago: el estado y las acciones están en PaymentViewModel; aquí queda lo de pantalla
// (arrastrar el comprobante, QR en grande, copiar el número y las confirmaciones)
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, TranslateModule, FormsModule, PaymentCouponComponent,
    PaymentHelpComponent, PaymentNoticeComponent, PaymentMissingComponent, PaymentQrZoomComponent],
  providers: [PaymentViewModel],
  templateUrl: './payment.html',
  styleUrls: ['./payment.scss']
})
export class PaymentComponent implements OnInit {

  readonly vm = inject(PaymentViewModel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  isDragging = false;
  // QR en grande con lupa
  qrZoomOpen = false;
  // signal para que el setTimeout de copyKey() repinte el botón (zoneless)
  copied = signal(false);

  ngOnInit(): void {
    this.vm.init(Number(this.route.snapshot.queryParamMap.get('booking')) || null);
  }

  copyKey() {
    navigator.clipboard?.writeText(this.vm.payee().key.replace(/\s/g, ''));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  // --- subida del comprobante ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.vm.setReceipt(file);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.vm.setReceipt(file);
  }

  // pide confirmación antes de cancelar la reserva (acción irreversible)
  cancelReservation() {
    const booking = this.vm.booking();
    if (!booking) return;

    const data: ConfirmModalData = {
      title: 'PAYMENT.CANCEL_CONFIRM.TITLE',
      message: 'PAYMENT.CANCEL_CONFIRM.MESSAGE',
      messageParams: { code: booking.code },
      confirmText: 'PAYMENT.CANCEL_CONFIRM.CONFIRM',
      // "Volver" en vez de "Cancelar" para no confundir con "cancelar reserva"
      cancelText: 'PAYMENT.CANCEL_CONFIRM.BACK',
      danger: true
    };

    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.vm.cancelBooking(code => this.onReservationCancelled(code));
      });
  }

  // avisa la cancelación y, al cerrar el aviso, vuelve al inicio
  private onReservationCancelled(code: string) {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      disableClose: true,
      data: {
        title: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_TITLE',
        message: 'PAYMENT.CANCEL_CONFIRM.SUCCESS_MESSAGE',
        messageParams: { code }
      }
    }).afterClosed().subscribe(() => this.router.navigate(['/client']));
  }
}
