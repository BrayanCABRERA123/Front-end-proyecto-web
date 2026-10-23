import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import {
  VEHICLE_TYPES,
  PLATE_LENGTH,
  RegisterVehicleModalData,
  VehicleFormValue,
  formatPlate,
  isMoto,
  isValidPlate,
  normalizePlate
} from './vehicle.model';

// modal para registrar un vehículo nuevo o editar uno existente
@Component({
  selector: 'app-register-vehicle-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, TranslateModule],
  templateUrl: './register-vehicle-modal.html',
  styleUrls: ['./register-vehicle-modal.scss']
})
export class RegisterVehicleModalComponent {

  vehicleTypes = VEHICLE_TYPES;
  plateLength = PLATE_LENGTH;

  form: FormGroup;

  // si recibe un vehículo, el modal funciona en modo edición
  isEditMode: boolean;

  // placas ya registradas (normalizadas) para evitar duplicados
  private takenPlates: string[];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegisterVehicleModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: RegisterVehicleModalData | null
  ) {
    const vehicle = data?.vehicle;

    this.isEditMode = !!vehicle;
    this.takenPlates = (data?.takenPlates ?? []).map(normalizePlate);

    this.form = this.fb.group({
      type: [vehicle?.type ?? '', Validators.required],
      brand: [
        vehicle?.brand ?? '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-ZÀ-ÿ0-9\s-]+$/)
        ]
      ],
      model: [vehicle?.model ?? '', Validators.maxLength(30)],
      // en el formulario la placa se escribe sin guion (ABC123)
      plate: [normalizePlate(vehicle?.plate ?? ''), Validators.required],
      color: [
        vehicle?.color ?? '',
        [
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-ZÀ-ÿ\s]*$/)
        ]
      ]
    }, { validators: this.plateValidator() });
  }

  // acceso rápido a los campos desde el HTML
  get f() {
    return this.form.controls;
  }

  get isMotoSelected(): boolean {
    return isMoto(this.f['type'].value);
  }

  // valida el formato de la placa según el tipo y que no esté repetida
  private plateValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const type = group.get('type')?.value;
      const plate = group.get('plate')?.value ?? '';

      // sin tipo o sin placa no se valida el formato (ya lo cubre "required")
      if (!type || !plate) return null;

      if (!isValidPlate(plate, type)) {
        return { plateFormat: true };
      }

      if (this.takenPlates.includes(plate)) {
        return { plateTaken: true };
      }

      return null;
    };
  }

  // mientras el usuario escribe: mayúsculas, sin espacios ni símbolos y máximo 6 caracteres
  onPlateInput(): void {
    const control = this.f['plate'];
    const clean = normalizePlate(control.value);

    if (clean !== control.value) {
      control.setValue(clean);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    const vehicle: VehicleFormValue = {
      type: value.type,
      brand: value.brand.trim(),
      model: value.model.trim(),
      // se guarda con guion (ABC-123), igual que los vehículos existentes
      plate: formatPlate(value.plate),
      color: value.color.trim()
    };

    this.dialogRef.close(vehicle);
  }

}
