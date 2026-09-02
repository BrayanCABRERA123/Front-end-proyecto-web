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

// íconos según el tipo de vehículo
const ICONO_POR_TIPO: Record<string, string> = {
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
  vehiculos = [
    { id: 1, tipo: 'SEDAN', marca: 'Mazda', modelo: '3 Sedán', placa: 'ABC-123', color: 'Gris', ultimoLavado: '10 Ago 2026', servicio: 'PREMIUM', totalLavados: 8 },
    { id: 2, tipo: 'MOTO', marca: 'Yamaha', modelo: 'FZ 2.0', placa: 'XYZ-98D', color: 'Azul', ultimoLavado: '02 Ago 2026', servicio: 'BASIC', totalLavados: 4 },
    { id: 3, tipo: 'TRUCK', marca: 'Toyota', modelo: 'Prado', placa: 'JKL-457', color: 'Blanco', ultimoLavado: '24 Jul 2026', servicio: 'FULL', totalLavados: 2 }
  ];

  get totalVehiculos(): number {
    return this.vehiculos.length;
  }

  get totalLavados(): number {
    return this.vehiculos.reduce((sum, v) => sum + v.totalLavados, 0);
  }

  get ultimoLavadoGeneral(): string {
    return this.vehiculos[0]?.ultimoLavado ?? '-';
  }

  constructor(private dialog: MatDialog) {}

  // ícono correspondiente al tipo de vehículo
  iconoDe(tipo: string): string {
    return ICONO_POR_TIPO[tipo] ?? 'directions_car';
  }

  // abre el modal para registrar un nuevo vehículo
  abrirModalRegistro() {
    const dialogRef = this.dialog.open(RegisterVehicleModalComponent, {
      panelClass: 'custom-dialog'
    });

    dialogRef.afterClosed().subscribe(nuevoVehiculo => {
      if (nuevoVehiculo) {
        this.vehiculos.push({
          id: Date.now(),
          ...nuevoVehiculo,
          ultimoLavado: '-',
          servicio: '-',
          totalLavados: 0
        });
      }
    });
  }

  // elimina un vehículo registrado
  eliminarVehiculo(id: number) {
    this.vehiculos = this.vehiculos.filter(v => v.id !== id);
  }

}
