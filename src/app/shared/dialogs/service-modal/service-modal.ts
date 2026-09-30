import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import {
  CatalogServiceRequest,
  CatalogServiceResponse,
  ServiceCategoryResponse,
} from '../../../core/models/booking.models';
import { VehicleTypeResponse } from '../../../core/models/vehicle.models';

// datos del modal: categorías y tipos de vehículo reales; service llega solo al EDITAR
export interface ServiceModalData {
  service?: CatalogServiceResponse;
  categories: ServiceCategoryResponse[];
  vehicleTypes: VehicleTypeResponse[];
}

// lo que devuelve el modal es justo el cuerpo que espera el booking-service
export type ServiceModalResult = CatalogServiceRequest;

// una fila de la tabla de tarifas: precio y minutos para un tipo de vehículo
interface PriceRow {
  vehicleTypeId: number;
  vehicleTypeName: string;
  price: number | null;
  minutes: number | null;
}

/**
 * Alta y edición de un servicio del catálogo. El precio depende del tipo de vehículo
 * (catalog.service_price, ADR-010), así que hay una fila por tipo. Una fila vacía significa
 * que el servicio no se ofrece para ese tipo de vehículo.
 */
@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './service-modal.html',
  styleUrl: './service-modal.scss'
})
export class ServiceModal {

  categories: ServiceCategoryResponse[];
  rows: PriceRow[];

  name = '';
  description = '';
  categoryId: number | null = null;

  // true cuando venimos de "editar" un servicio ya existente
  isEditing = false;

  constructor(
    private dialogRef: MatDialogRef<ServiceModal>,
    @Inject(MAT_DIALOG_DATA) data: ServiceModalData
  ) {
    this.categories = data.categories;
    const service = data.service;
    this.isEditing = !!service;
    this.name = service?.name ?? '';
    this.description = service?.description ?? '';
    this.categoryId = service?.category?.id ?? data.categories[0]?.id ?? null;
    this.rows = data.vehicleTypes.map(type => {
      const current = service?.prices.find(p => p.vehicleTypeId === type.id);
      return {
        vehicleTypeId: type.id,
        vehicleTypeName: type.name,
        price: current?.price ?? null,
        minutes: current?.estimatedMinutes ?? null,
      };
    });
  }

  // filas completas (precio y minutos); las vacías no se envían
  private get filledRows(): PriceRow[] {
    return this.rows.filter(row => row.price !== null && row.minutes !== null);
  }

  // una fila a medias (solo precio o solo minutos) no es válida
  get hasHalfRow(): boolean {
    return this.rows.some(row => (row.price === null) !== (row.minutes === null));
  }

  get canSave(): boolean {
    return this.name.trim().length > 0
      && this.categoryId !== null
      && this.filledRows.length > 0
      && !this.hasHalfRow;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave || this.categoryId === null) return;

    const result: ServiceModalResult = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      categoryId: this.categoryId,
      prices: this.filledRows.map(row => ({
        vehicleTypeId: row.vehicleTypeId,
        price: row.price ?? 0,
        estimatedMinutes: row.minutes ?? 0,
      })),
    };

    this.dialogRef.close(result);
  }
}
