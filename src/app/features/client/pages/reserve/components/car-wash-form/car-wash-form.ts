import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar mensajes de éxito o error
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
import { BookingResponse } from '../../../../../../core/models/booking.models';
import { ReserveViewModel, minutesOf, priceOf } from '../../../../viewmodels/reserve.viewmodel';
import { businessAddress, businessName } from '../../../../../../core/utils/booking-display';

// vista del formulario de reserva: la selección, las horas libres y la creación están en ReserveViewModel
@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  providers: [ReserveViewModel],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  readonly vm = inject(ReserveViewModel);
  // nombre y dirección de la sede con texto neutro si vienen vacíos
  readonly name = businessName;
  readonly address = businessAddress;
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly priceOf = priceOf;
  readonly minutesOf = minutesOf;

  ngOnInit(): void {
    this.vm.load();
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    this.vm.submit(booking => this.showReservationSuccess(booking));
  }

  // muestra el modal de reserva exitosa con lo que guardó el backend y, al cerrarlo, lleva al pago
  private showReservationSuccess(booking: BookingResponse): void {
    const vehicle = booking.vehicle;

    const data: StatusModalData = {
      title: 'RESERVE.SUCCESS_TITLE',
      message: 'RESERVE.SUCCESS_MESSAGE',
      buttonText: 'RESERVE.SUCCESS_BUTTON',
      details: [
        { label: 'RESERVE.SUMMARY.CODE', value: booking.code },
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${vehicle?.brand ?? ''} ${vehicle?.model ?? ''}`.trim() },
        { label: 'RESERVE.SUMMARY.PLATE', value: vehicle?.licensePlateFormatted ?? '' },
        { label: 'RESERVE.SUMMARY.SERVICE', value: booking.services.map(s => s.name).join(', ') },
        { label: 'RESERVE.SUMMARY.DATE', value: booking.date },
        { label: 'RESERVE.SUMMARY.TIME', value: `${booking.startTime} - ${booking.endTime}` },
        { label: 'RESERVE.SUMMARY.BAY', value: booking.bay?.name ?? '' },
        { label: 'RESERVE.SUMMARY.CAR_WASH', value: businessAddress(this.vm.location()) ?? '—' },
        { label: 'RESERVE.SUMMARY.TOTAL', value: new CopPricePipe().transform(booking.total) }
      ]
    };

    const dialogRef = this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      // evita que se cierre al hacer clic afuera o con ESC, así el usuario
      // siempre pasa por el botón y se garantiza la redirección al pago
      disableClose: true,
      data
    });

    dialogRef.afterClosed().subscribe(() => {
      // el siguiente paso del flujo es pagar ESTA reserva: sin el id, la pantalla de pago
      // elegiría la próxima activa, que puede ser otra reserva del cliente
      this.router.navigate(['/client/payment'], { queryParams: { booking: booking.id } });
    });
  }
}
