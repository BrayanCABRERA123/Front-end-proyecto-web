// definimos el componente
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// importamos el sidebar del layout
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
// modal de registro de vehículo
import { RegisterVehicleModalComponent } from '../../../../shared/dialogs/register-vehicle-modal/register-vehicle-modal';
import { Api } from '../../../../core/services/api';
import { Auth } from '../../../../core/services/auth';

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
export class VehiclesComponent implements OnInit {

  // vehículos registrados por el cliente
  vehiculos: any[] = [];

  get totalVehiculos(): number {
    return this.vehiculos.length;
  }

  get totalLavados(): number {
    return this.vehiculos.reduce((sum, v) => sum + v.totalLavados, 0);
  }

  get ultimoLavadoGeneral(): string {
    return this.vehiculos[0]?.ultimoLavado ?? '-';
  }

  // id del cliente logueado; 2 (Juan Díaz) es el demo por defecto si nadie inició sesión
  private get userId(): number {
    return this.auth.getCurrentUser()?.id ?? 2;
  }

  constructor(private dialog: MatDialog, private api: Api, private auth: Auth, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getVehiclesByUser(this.userId).subscribe(vehiculos => {
      this.vehiculos = vehiculos;
      this.cdr.detectChanges();
    });
  }

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
        this.api
          .addVehicle({ ...nuevoVehiculo, userId: this.userId, ultimoLavado: '-', servicio: '-', totalLavados: 0 })
          .subscribe({
            next: creado => {
              this.vehiculos = [...this.vehiculos, creado];
              this.cdr.detectChanges();
            },
            error: () => alert('No se pudo registrar el vehículo. Intenta de nuevo.')
          });
      }
    });
  }

  // elimina un vehículo registrado
  eliminarVehiculo(id: number) {
    this.api.deleteVehicle(id).subscribe(() => {
      this.vehiculos = this.vehiculos.filter(v => v.id !== id);
      this.cdr.detectChanges();
    });
  }

}
