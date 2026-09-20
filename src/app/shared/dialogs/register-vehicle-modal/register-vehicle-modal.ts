import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-register-vehicle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './register-vehicle-modal.html',
  styleUrls: ['./register-vehicle-modal.scss']
})
export class RegisterVehicleModalComponent {

  // tipos de vehículo disponibles (reutiliza las claves ya usadas en VEHICLE.*)
  vehicleTypes = ['CAR', 'SEDAN', 'SUV', 'PICKUP', 'TRUCK', 'MOTO'];

  // datos del formulario
  type = '';
  brand = '';
  model = '';
  plate = '';
  color = '';

  constructor(private dialogRef: MatDialogRef<RegisterVehicleModalComponent>) {}

  // valida que los campos obligatorios estén completos
  get isFormValid(): boolean {
    return !!this.type && !!this.brand && !!this.plate;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (!this.isFormValid) return;

    this.dialogRef.close({
      type: this.type,
      brand: this.brand,
      model: this.model,
      plate: this.plate,
      color: this.color
    });
  }

}
