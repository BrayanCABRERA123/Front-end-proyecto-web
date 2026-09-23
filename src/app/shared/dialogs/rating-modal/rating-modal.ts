import { ChangeDetectorRef, Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking, BookingsService } from '../../../core/services/bookings';

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './rating-modal.html',
  styleUrl: './rating-modal.scss'
})
export class RatingModalComponent {

  // Opcionales: el componente también está registrado como ruta (/client/ratings),
  // donde no hay diálogo ni reserva que calificar.
  constructor(
    private bookingsService: BookingsService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef: MatDialogRef<RatingModalComponent> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private booking: Booking | null
  ) { }

  closeModal(result?: Booking): void {
    this.dialogRef?.close(result);
  }

  rating = 0;

  comment = '';

  saving = false;

  rate(value: number): void {
    this.rating = value;
  }

  // Guarda la calificación en el mock (service_execution.quality_rating) y devuelve
  // la reserva actualizada a quien abrió el modal.
  submit(): void {
    if (!this.booking || this.rating === 0 || this.saving) return;

    this.saving = true;

    this.bookingsService.rate$(this.booking.id, this.rating, this.comment).subscribe({
      next: updated => this.closeModal(updated),
      error: () => {
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

}
