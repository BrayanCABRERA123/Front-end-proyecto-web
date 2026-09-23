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
import { Vehicle, VehiclesService } from '../../../../core/services/vehicles';
import { Catalog, VehicleType } from '../../../../core/services/catalog';
import { HttpErrorResponse } from '@angular/common/http';

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

  // vehículos registrados por el cliente
  vehicles: Vehicle[] = [];

  private vehicleTypes: VehicleType[] = [];

  // mensaje del mock API (placa duplicada, vehículo con reservas, etc.)
  errorMessage: string | null = null;

  constructor(
    private dialog: MatDialog,
    private vehiclesService: VehiclesService,
    private catalog: Catalog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catalog.vehicleTypes$().subscribe(types => (this.vehicleTypes = types));

    this.vehiclesService.myVehicles$().subscribe(vehicles => {
      this.vehicles = vehicles;
      this.cdr.markForCheck();
    });
  }

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get totalWashes(): number {
    return this.vehicles.reduce((sum, v) => sum + v.totalWashes, 0);
  }

  // el lavado más reciente entre todos los vehículos
  get lastWashOverall(): string {
    const latest = this.vehicles
      .filter(v => v.lastWashAt)
      .sort((a, b) => b.lastWashAt!.localeCompare(a.lastWashAt!))[0];
    return latest?.lastWash ?? '-';
  }

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
      if (!newVehicle) return;

      const vehicleType = this.vehicleTypes.find(t => t.code === newVehicle.type);

      this.vehiclesService
        .create$({
          licensePlate: newVehicle.plate,
          vehicleTypeId: vehicleType ? vehicleType.id : this.vehicleTypes[0]?.id,
          brand: newVehicle.brand,
          model: newVehicle.model,
          color: newVehicle.color
        })
        .subscribe({
          next: vehicle => {
            this.errorMessage = null;
            this.vehicles = [...this.vehicles, vehicle];
            this.cdr.markForCheck();
          },
          error: (err: HttpErrorResponse) => this.showError(err)
        });
    });
  }

  // elimina un vehículo registrado
  removeVehicle(id: number) {
    this.vehiclesService.remove$(id).subscribe({
      next: () => {
        this.errorMessage = null;
        this.vehicles = this.vehicles.filter(v => v.id !== id);
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => this.showError(err)
    });
  }

  private showError(err: HttpErrorResponse) {
    this.errorMessage = err.error?.message ?? 'Error';
    this.cdr.markForCheck();
  }

}
