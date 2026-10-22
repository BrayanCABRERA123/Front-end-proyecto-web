import { Component, Inject, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { Booking } from '../../../../models/admin.models';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
import { BookingFormViewModel } from '../../../../viewmodels/booking-form.viewmodel';

// presente cuando se reprograma una reserva existente
export interface BookingModalData {
  booking?: Booking;
}

/**
 * Vista del modal de nueva reserva o reprogramación del admin: la búsqueda del vehículo, los
 * servicios, las horas libres y el guardado están en BookingFormViewModel.
 */
@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, CopPricePipe],
  providers: [BookingFormViewModel],
  templateUrl: './booking-modal.html',
  styleUrl: './booking-modal.scss',
})
export class BookingModal {

  readonly vm = inject(BookingFormViewModel);

  constructor(
    private dialogRef: MatDialogRef<BookingModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: BookingModalData | null,
  ) {
    this.vm.init(data?.booking);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  // se cierra con la reserva ya confirmada por el backend (y su bahía)
  save(): void {
    this.vm.save(booking => this.dialogRef.close(booking));
  }
}
