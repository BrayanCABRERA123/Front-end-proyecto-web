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
  tiposVehiculo = ['CAR', 'SEDAN', 'SUV', 'PICKUP', 'TRUCK', 'MOTO'];

  // datos del formulario
  tipo = '';
  marca = '';
  modelo = '';
  placa = '';
  color = '';

  constructor(private dialogRef: MatDialogRef<RegisterVehicleModalComponent>) {}

  // valida que los campos obligatorios estén completos
  get formularioValido(): boolean {
    return !!this.tipo && !!this.marca && !!this.placa;
  }

  cancelar() {
    this.dialogRef.close();
  }

  guardar() {
    if (!this.formularioValido) return;

    this.dialogRef.close({
      tipo: this.tipo,
      marca: this.marca,
      modelo: this.modelo,
      placa: this.placa,
      color: this.color
    });
  }

}
