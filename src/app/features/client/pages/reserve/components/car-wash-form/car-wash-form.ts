import { Component, OnInit, inject } from '@angular/core';
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
// precios de los servicios (en COP) y su formato
import { SERVICE_PRICES } from '../../../../../../core/constants/service-prices';
import { CopPricePipe } from '../../../../../../shared/pipes/cop-price.pipe';
// servicio real de vehículos del cliente
import { VehiclesService } from '../../../../../../core/services/vehicles';
import { VehicleResponse } from '../../../../../../core/models/vehicle.models';

@Component({
  selector: 'app-car-wash-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TranslateModule, CopPricePipe],
  templateUrl: './car-wash-form.html',
  styleUrl: './car-wash-form.scss'
})
export class CarWashFormComponent implements OnInit {

  private readonly vehiclesService = inject(VehiclesService);

  // vehículos registrados del cliente (reales del backend)
  vehicles: VehicleResponse[] = [];
  vehiclesLoading = false;

  // catálogo de servicios disponibles
  services = ['BASIC', 'PREMIUM', 'FULL'];
  mostPopularService = 'PREMIUM';
  prices = SERVICE_PRICES;

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
    this.loadVehicles();
  }

  private loadVehicles(): void {
    this.vehiclesLoading = true;
    this.vehiclesService.list().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.vehiclesLoading = false;
      },
      error: () => {
        this.vehicles = [];
        this.vehiclesLoading = false;
      }
    });
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

  // precio del servicio seleccionado (0 si aún no se elige)
  get serviceTotal(): number {
    return SERVICE_PRICES[this.selectedService] ?? 0;
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
        { label: 'RESERVE.SUMMARY.PLATE', value: vehicle?.licensePlateFormatted ?? '' },
        { label: 'RESERVE.SUMMARY.SERVICE', value: this.translate.instant(`SERVICE.${this.selectedService}`) },
        { label: 'RESERVE.SUMMARY.DATE', value: this.date },
        { label: 'RESERVE.SUMMARY.TIME', value: this.time },
        { label: 'RESERVE.SUMMARY.LOCATION', value: this.location.address },
        { label: 'RESERVE.SUMMARY.TOTAL', value: new CopPricePipe().transform(this.serviceTotal) }
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
