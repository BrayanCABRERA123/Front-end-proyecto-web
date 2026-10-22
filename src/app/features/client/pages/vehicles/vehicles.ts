// definimos el componente
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
// modal de registro de vehículo
import { RegisterVehicleModalComponent } from '../../../../shared/dialogs/register-vehicle-modal/register-vehicle-modal';
import { RegisterVehicleModalData, VehicleFormValue, normalizePlate } from '../../../../shared/dialogs/register-vehicle-modal/vehicle.model';
// modal reutilizable para mostrar mensajes de éxito o error
import { StatusModal } from '../../../../shared/dialogs/status-modal/status-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
// servicio que habla con el customer-service
import { VehiclesService } from '../../../../core/services/vehicles';
import { VehicleRequest, VehicleResponse } from '../../../../core/models/vehicle.models';
// convierte un error del backend en la llave de traducción API_ERRORS.<code>
import { apiErrorKey } from '../../../../core/utils/api-error';
// reservas del cliente (booking-service): de ahí salen los lavados hechos
import { BookingApiService } from '../../../../core/services/booking-api';
import { isFinishedStatus, isoToDisplayDate } from '../../../../core/utils/booking-display';

// lo único que necesita la tarjeta de cada vehículo, armado desde la respuesta del backend
interface VehicleCard {
  id: number;
  type: string;   // código del tipo, p. ej. SEDAN
  brand: string;
  model: string;
  plate: string;  // placa con guion para mostrar (ABC-123)
  color: string;
}

// íconos según el tipo de vehículo
const ICON_BY_TYPE: Record<string, string> = {
  CAR: 'directions_car',
  SEDAN: 'directions_car',
  SUV: 'directions_car',
  PICKUP: 'local_shipping',
  TRUCK: 'local_shipping',
  MOTO: 'two_wheeler'
};

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, MatDialogModule, TranslateModule],
  templateUrl: './vehicles.html',
  styleUrls: ['./vehicles.scss']
})
export class VehiclesComponent implements OnInit {

  // vehículos registrados por el cliente (se llenan al entrar a la pantalla)
  vehicles: VehicleCard[] = [];

  // lavados terminados (reservas COMPLETED) y la fecha del más reciente (dd/mm/aaaa)
  totalWashes = 0;
  lastWashOverall = '—';

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private vehiclesService: VehiclesService,
    private bookingApi: BookingApiService
  ) {}

  // al abrir la pantalla pedimos los vehículos y las reservas del cliente
  ngOnInit(): void {
    this.reload();
    this.loadWashes();
  }

  // número de vehículos que se muestra en la tarjeta de estadísticas
  get totalVehicles(): number {
    return this.vehicles.length;
  }

  // cuenta las reservas terminadas; si booking-service no responde se queda en 0 y "—"
  private loadWashes(): void {
    this.bookingApi.myBookings().subscribe({
      next: (bookings) => {
        const washes = bookings.filter(booking => isFinishedStatus(booking.status));
        this.totalWashes = washes.length;
        // las fechas llegan como aaaa-mm-dd, así que ordenarlas como texto las ordena por fecha
        const last = washes.map(booking => booking.date).sort().pop();
        this.lastWashOverall = last ? isoToDisplayDate(last) : '—';
        this.refreshView();
      },
      error: () => undefined
    });
  }

  // pide los vehículos al backend y los deja listos para la pantalla
  reload(): void {
    this.vehiclesService.list().subscribe({
      next: (list) => {
        this.vehicles = list.map(this.toCard);
        this.refreshView();
      },
      error: (error) => this.showError(error)
    });
  }

  // convierte la respuesta del backend en lo que usa la tarjeta
  private toCard(vehicle: VehicleResponse): VehicleCard {
    return {
      id: vehicle.id,
      type: vehicle.vehicleType,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.licensePlateFormatted,
      color: vehicle.color
    };
  }

  // convierte el formulario del modal en el cuerpo que espera POST/PUT
  private toRequest(vehicle: VehicleFormValue): VehicleRequest {
    return {
      licensePlate: normalizePlate(vehicle.plate),
      vehicleType: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color
    };
  }

  // ícono correspondiente al tipo de vehículo
  iconFor(type: string): string {
    return ICON_BY_TYPE[type] ?? 'directions_car';
  }

  // abre el modal para registrar un nuevo vehículo
  openRegisterModal() {
    const data: RegisterVehicleModalData = {
      takenPlates: this.vehicles.map(v => v.plate)
    };

    const dialogRef = this.dialog.open(RegisterVehicleModalComponent, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe((newVehicle?: VehicleFormValue) => {
      if (!newVehicle) return;

      this.vehiclesService.register(this.toRequest(newVehicle)).subscribe({
        next: () => {
          this.reload();
          this.showSuccess('VEHICLES.SUCCESS.CREATED_TITLE', 'VEHICLES.SUCCESS.CREATED_MESSAGE');
        },
        error: (error) => this.showError(error)
      });
    });
  }

  // abre el mismo modal en modo edición con los datos del vehículo
  openEditModal(id: number) {
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) return;

    const data: RegisterVehicleModalData = {
      vehicle: {
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        plate: vehicle.plate,
        color: vehicle.color
      },
      // se excluye su propia placa para que pueda guardarla sin cambiarla
      takenPlates: this.vehicles.filter(v => v.id !== id).map(v => v.plate)
    };

    const dialogRef = this.dialog.open(RegisterVehicleModalComponent, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe((updated?: VehicleFormValue) => {
      if (!updated) return;

      this.vehiclesService.update(id, this.toRequest(updated)).subscribe({
        next: () => {
          this.reload();
          this.showSuccess('VEHICLES.SUCCESS.UPDATED_TITLE', 'VEHICLES.SUCCESS.UPDATED_MESSAGE');
        },
        error: (error) => this.showError(error)
      });
    });
  }

  // abre el modal de estado de éxito con los textos indicados
  private showSuccess(title: string, message: string) {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data: { title, message }
    });
  }

  // abre el modal de error: el mensaje es la traducción del code que manda el backend
  private showError(error: unknown) {
    this.dialog.open(StatusModal, {
      panelClass: 'custom-dialog',
      data: { title: 'COMMON.ERROR', message: apiErrorKey(error), type: 'error' }
    });
  }

  // pide confirmación antes de eliminar un vehículo registrado
  confirmRemoveVehicle(id: number) {
    const vehicle = this.vehicles.find(v => v.id === id);
    if (!vehicle) return;

    const data: ConfirmModalData = {
      title: 'VEHICLES.DELETE.TITLE',
      message: 'VEHICLES.DELETE.MESSAGE',
      messageParams: {
        name: `${vehicle.brand} ${vehicle.model}`.trim(),
        plate: vehicle.plate
      },
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, {
      panelClass: 'custom-dialog',
      data
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.removeVehicle(id);
    });
  }

  // elimina el vehículo en el backend y vuelve a pedir la lista
  private removeVehicle(id: number) {
    this.vehiclesService.remove(id).subscribe({
      next: () => {
        this.reload();
        this.refreshView();
      },
      error: (error) => this.showError(error)
    });
  }

  // la app es zoneless: los cambios hechos dentro de afterClosed() no se pintan solos,
  // así que avisamos a Angular que redibuje la pantalla
  private refreshView() {
    this.cdr.markForCheck();
  }

}