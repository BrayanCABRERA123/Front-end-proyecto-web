import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { RedeemPromotionResult } from '../../../../../../core/services/loyalty-api';

// cuadro para canjear un cupón de fidelización (ADR-015). Solo pinta: el canje lo hace la pantalla
// de pago, que conoce la reserva y recalcula el total.
@Component({
  selector: 'app-payment-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './payment-coupon.html',
  styleUrl: './payment-coupon.scss'
})
export class PaymentCouponComponent {
  @Input() code = '';
  @Output() codeChange = new EventEmitter<string>();
  @Input() result: RedeemPromotionResult | null = null;
  @Input() error: string | null = null;
  @Input() redeeming = false;
  @Input() canRedeem = false;
  @Input() locked = false;

  @Output() redeem = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();
}
