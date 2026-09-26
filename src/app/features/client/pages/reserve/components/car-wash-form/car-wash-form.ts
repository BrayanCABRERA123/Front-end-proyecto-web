import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
// iconos de Material
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
// modal reutilizable para mostrar el mensaje de reserva exitosa
import { StatusModal, StatusModalData } from '../../../../../../shared/dialogs/status-modal/status-modal';
// sede del lavadero: el cliente lleva su vehículo allí
import { BUSINESS_LOCATION } from '../../../../../../core/constants/business-location';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  // vehículos registrados del cliente (mismo mock que en Mis Vehículos)
  vehicles = [
    { id: 1, type: 'SEDAN', brand: 'Mazda', model: '3 Sedán', plate: 'ABC-123' },
    { id: 2, type: 'MOTO', brand: 'Yamaha', model: 'FZ 2.0', plate: 'XYZ-98D' },
    { id: 3, type: 'TRUCK', brand: 'Toyota', model: 'Prado', plate: 'JKL-457' }
  ];

  // catálogo de servicios disponibles
  services = ['BASIC', 'PREMIUM', 'FULL'];
  mostPopularService = 'PREMIUM';

  // selección del usuario
  selectedVehicleId: number | null = null;
  selectedService: string = '';
  date: string = '';
  time: string = '';

  // lugar donde se presta el servicio (sede única, no es a domicilio)
  location = BUSINESS_LOCATION;

  // rango de fechas permitido
  minDate: string = '';
  maxDate: string = '';
  availableTimes: string[] = [];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const max = new Date();
    max.setDate(today.getDate() + 60);
    this.maxDate = max.toISOString().split('T')[0];

    this.generateTimes();
  }

  generateTimes(): void {
    this.availableTimes = [];

    for (let h = 8; h <= 12; h++) {
      this.availableTimes.push(h.toString().padStart(2, '0') + ':00');
    }
    for (let h = 13; h <= 18; h++) {
      this.availableTimes.push(h.toString().padStart(2, '0') + ':00');
    }
  }

  selectVehicle(id: number) {
    this.selectedVehicleId = id;
  }

  selectService(service: string) {
    this.selectedService = service;
  }

  get vehicle() {
    return this.vehicles.find(v => v.id === this.selectedVehicleId) ?? null;
  }

  // extrae el valor numérico del precio del servicio (ej. "$35.000" -> 35000)
  get serviceTotal(): number {
    if (!this.selectedService) return 0;

    const key = `SERVICE.${this.selectedService}_PRICE`;
    const text: string = this.translate.instant(key);
    const number = text.replace(/[^0-9]/g, '');

    return number ? parseInt(number, 10) : 0;
  }

  get isFormValid(): boolean {
    return !!this.selectedVehicleId && !!this.selectedService && !!this.date && !!this.time;
  }

  // se ejecuta al hacer clic en "Reservar Ahora"
  onSubmit(): void {
    if (!this.isFormValid) return;

    // TODO: integrar con el backend de reservas
    console.log('Reserva enviada', {
      vehicle: this.vehicle,
      service: this.selectedService,
      date: this.date,
      time: this.time,
      total: this.serviceTotal
    });

    this.showReservationSuccess();
  }

  // muestra el modal de reserva exitosa con el resumen y, al cerrarlo, lleva al pago
  private showReservationSuccess(): void {
    const vehicle = this.vehicle;

    const data: StatusModalData = {
      title: 'RESERVE.SUCCESS_TITLE',
      message: 'RESERVE.SUCCESS_MESSAGE',
      buttonText: 'RESERVE.SUCCESS_BUTTON',
      // mismo resumen que se ve en la tarjeta lateral del formulario
      details: [
        { label: 'RESERVE.SUMMARY.VEHICLE', value: `${vehicle?.brand} ${vehicle?.model}` },
        { label: 'RESERVE.SUMMARY.PLATE', value: vehicle?.plate ?? '' },
        { label: 'RESERVE.SUMMARY.SERVICE', value: this.translate.instant(`SERVICE.${this.selectedService}`) },
        { label: 'RESERVE.SUMMARY.DATE', value: this.date },
        { label: 'RESERVE.SUMMARY.TIME', value: this.time },
        { label: 'RESERVE.SUMMARY.LOCATION', value: this.location.address },
        { label: 'RESERVE.SUMMARY.TOTAL', value: this.translate.instant(`SERVICE.${this.selectedService}_PRICE`) }
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
      // el siguiente paso del flujo es pagar la reserva
      this.router.navigate(['/client/payment']);
    });
  }

}
