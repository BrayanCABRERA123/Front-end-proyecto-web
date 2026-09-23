import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Catalog } from '../../../core/services/catalog';

@Component({
  selector: 'app-register-vehicle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './register-vehicle-modal.html',
  styleUrls: ['./register-vehicle-modal.scss']
})
export class RegisterVehicleModalComponent implements OnInit {

  // tipos de vehículo activos del catálogo (vehicle_type); el código se traduce con VEHICLE.*
  vehicleTypes: string[] = [];

  // datos del formulario
  type = '';
  brand = '';
  model = '';
  plate = '';
  color = '';

  constructor(
    private dialogRef: MatDialogRef<RegisterVehicleModalComponent>,
    private catalog: Catalog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.catalog.vehicleTypes$().subscribe(types => {
      this.vehicleTypes = types.filter(t => t.isActive).map(t => t.code);
      this.cdr.markForCheck();
    });
  }

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
