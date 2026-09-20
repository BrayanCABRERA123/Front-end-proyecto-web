import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface ServiceCategory { value: string; label: string; }

// datos que se le pasan al modal cuando se abre para EDITAR un servicio existente
// si se abre para crear uno nuevo, simplemente no se manda data
export interface ServiceModalData {
  name: string;
  price: number;
  description: string;
  durationMin: number;
  category: string;
}

export interface ServiceModalResult {
  name: string;
  price: number;
  description: string;
  durationMin: number;
  category: string;
}

@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './service-modal.html',
  styleUrl: './service-modal.scss'
})
export class ServiceModal {

  // categorías del catálogo (mismas del mockup: Lavado, Brillado)
  categories: ServiceCategory[] = [
    { value: 'lavado', label: 'Lavado' },
    { value: 'brillado', label: 'Brillado' },
    { value: 'detailing', label: 'Detailing' },
  ];

  name = '';
  price: number | null = null;
  description = '';
  durationMin = 30;
  category = 'lavado';

  // true cuando venimos de "editar" un servicio ya existente
  isEditing = false;

  constructor(
    private dialogRef: MatDialogRef<ServiceModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: ServiceModalData | null
  ) {
    if (data) {
      this.isEditing = true;
      this.name = data.name;
      this.price = data.price;
      this.description = data.description;
      this.durationMin = data.durationMin;
      this.category = data.category;
    }
  }

  get canSave(): boolean {
    return this.name.trim().length > 0 && !!this.price && this.price > 0;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave) return;

    const result: ServiceModalResult = {
      name: this.name.trim(),
      price: this.price ?? 0,
      description: this.description.trim(),
      durationMin: this.durationMin,
      category: this.category
    };

    this.dialogRef.close(result);
  }
}
