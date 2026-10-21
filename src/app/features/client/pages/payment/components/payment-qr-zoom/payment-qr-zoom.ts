import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// niveles de la lupa; el doble clic alterna entre el primero y el tercero
const ZOOM_LEVELS = [1, 1.5, 2, 3];

// QR de la cuenta del lavadero en grande, con lupa (+/−), doble clic y rueda del mouse para
// ampliarlo. Con zoom la imagen se recorre con las barras de desplazamiento o arrastrando en el
// celular. Fondo blanco para que se escanee bien desde otro teléfono.
@Component({
  selector: 'app-payment-qr-zoom',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './payment-qr-zoom.html',
  styleUrl: './payment-qr-zoom.scss'
})
export class PaymentQrZoomComponent implements OnChanges {
  @Input() open = false;
  @Input() src: string | null = null;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  level = 0;

  get zoom(): number {
    return ZOOM_LEVELS[this.level];
  }

  get canZoomIn(): boolean {
    return this.level < ZOOM_LEVELS.length - 1;
  }

  get canZoomOut(): boolean {
    return this.level > 0;
  }

  // cada vez que se abre empieza sin zoom
  ngOnChanges(): void {
    if (this.open) this.level = 0;
  }

  zoomIn(): void {
    if (this.canZoomIn) this.level++;
  }

  zoomOut(): void {
    if (this.canZoomOut) this.level--;
  }

  toggleZoom(): void {
    this.level = this.level === 0 ? 2 : 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }
}
