// definimos el componente
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
// modal de registro de vehículo
import { RegisterVehicleModalComponent } from '../../../../shared/dialogs/register-vehicle-modal/register-vehicle-modal';
import { RegisterVehicleModalData, VehicleFormValue } from '../../../../shared/dialogs/register-vehicle-modal/vehicle.model';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ClientVehiclesViewModel } from '../../viewmodels/vehicles.viewmodel';

// íconos según el tipo de vehículo
const ICON_BY_TYPE: Record<string, string> = {
  CAR: 'directions_car',
  SEDAN: 'directions_car',
  SUV: 'directions_car',
  PICKUP: 'local_shipping',
  TRUCK: 'local_shipping',
  MOTO: 'two_wheeler'
};

// vista de Mis vehículos: la lista y las acciones están en ClientVehiclesViewModel
@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatIconModule, MatDialogModule, TranslateModule],
  providers: [ClientVehiclesViewModel],
  templateUrl: './vehicles.html',
  styleUrls: ['./vehicles.scss']
})
export class VehiclesComponent implements OnInit {

  readonly vm = inject(ClientVehiclesViewModel);
  private readonly dialog = inject(MatDialog);

  // al abrir la pantalla pedimos los vehículos y las reservas del cliente
  ngOnInit(): void {
    this.vm.load();
  }

  // ícono correspondiente al tipo de vehículo
  iconFor(type: string): string {
    return ICON_BY_TYPE[type] ?? 'directions_car';
  }

  // abre el modal para registrar un nuevo vehículo
  openRegisterModal() {
    const data: RegisterVehicleModalData = {
      takenPlates: this.vm.vehicles().map(v => v.plate)
    };

    this.dialog.open(RegisterVehicleModalComponent, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((newVehicle?: VehicleFormValue) => {
        if (newVehicle) this.vm.register(newVehicle);
      });
  }

  // abre el mismo modal en modo edición con los datos del vehículo
  openEditModal(id: number) {
    const vehicle = this.vm.find(id);
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
      takenPlates: this.vm.vehicles().filter(v => v.id !== id).map(v => v.plate)
    };

    this.dialog.open(RegisterVehicleModalComponent, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((updated?: VehicleFormValue) => {
        if (updated) this.vm.update(id, updated);
      });
  }

  // pide confirmación antes de eliminar un vehículo registrado
  confirmRemoveVehicle(id: number) {
    const vehicle = this.vm.find(id);
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

    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) this.vm.remove(id);
      });
  }
}
