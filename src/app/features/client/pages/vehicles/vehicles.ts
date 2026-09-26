// definimos el componente
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
// modal de registro de vehículo
import { RegisterVehicleModalComponent } from '../../../../shared/dialogs/register-vehicle-modal/register-vehicle-modal';
// modal reutilizable de confirmación para acciones peligrosas
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';

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
export class VehiclesComponent {

  // vehículos registrados por el cliente
  vehicles = [
    { id: 1, type: 'SEDAN', brand: 'Mazda', model: '3 Sedán', plate: 'ABC-123', color: 'Gris', lastWash: '10 Ago 2026', service: 'PREMIUM', totalWashes: 8 },
    { id: 2, type: 'MOTO', brand: 'Yamaha', model: 'FZ 2.0', plate: 'XYZ-98D', color: 'Azul', lastWash: '02 Ago 2026', service: 'BASIC', totalWashes: 4 },
    { id: 3, type: 'TRUCK', brand: 'Toyota', model: 'Prado', plate: 'JKL-457', color: 'Blanco', lastWash: '24 Jul 2026', service: 'FULL', totalWashes: 2 }
  ];

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get totalWashes(): number {
    return this.vehicles.reduce((sum, v) => sum + v.totalWashes, 0);
  }

  get lastWashOverall(): string {
    return this.vehicles[0]?.lastWash ?? '-';
  }

  constructor(private dialog: MatDialog) {}

  // ícono correspondiente al tipo de vehículo
  iconFor(type: string): string {
    return ICON_BY_TYPE[type] ?? 'directions_car';
  }

  // abre el modal para registrar un nuevo vehículo
  openRegisterModal() {
    const dialogRef = this.dialog.open(RegisterVehicleModalComponent, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(newVehicle => {
      if (newVehicle) {
        this.vehicles.push({
          id: Date.now(),
          ...newVehicle,
          lastWash: '-',
          service: '-',
          totalWashes: 0
        });
      }
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

  // elimina un vehículo registrado
  private removeVehicle(id: number) {
    // TODO: integrar con el backend para eliminar el vehículo
    this.vehicles = this.vehicles.filter(v => v.id !== id);
  }

}
