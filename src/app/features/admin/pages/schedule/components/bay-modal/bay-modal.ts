import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { BayStatus, WashBay } from '../../../../models/admin.models';

// operarios que se pueden asignar a una bahía activa
export interface BayOperatorOption {
  id: string;
  name: string;
}

// si se mandan datos estamos editando; si no, creando
export type WashBayModalData = WashBay & { operators: BayOperatorOption[] };

export interface WashBayModalResult {
  name: string;
  status: BayStatus;
  currentOperator: string | null;
}

@Component({
  selector: 'app-bay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './bay-modal.html',
  styleUrl: './bay-modal.scss',
})
export class WashBayModal {

  // únicos tres estados permitidos para una bahía
  readonly statuses: { value: BayStatus; labelKey: string }[] = [
    { value: 'active', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.active' },
    { value: 'inactive', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.inactive' },
    { value: 'maintenance', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.maintenance' },
  ];

  name = '';
  status: BayStatus = 'active';
  operatorName: string | null = null;

  isEditing = false;
  nameTouched = false;
  submitted = false;

  operators: BayOperatorOption[] = [];
  /** la bahía no se puede dejar sin nombre */
  readonly maxLength = 40;

  constructor(
    private dialogRef: MatDialogRef<WashBayModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: WashBayModalData | null,
  ) {
    if (data) {
      this.isEditing = true;
      this.name = data.name;
      this.status = data.status;
      this.operatorName = data.currentOperator;
    }
    this.operators = data?.operators ?? [];
  }

  // solo las bahías activas pueden tener operario asignado
  get canAssignOperator(): boolean {
    return this.status === 'active';
  }

  get nameError(): boolean {
    return this.submitted && !this.nameValid;
  }

  private get nameValid(): boolean {
    return this.name.trim().length >= 2 && this.name.trim().length <= this.maxLength;
  }

  get canSave(): boolean {
    return this.nameValid;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const result: WashBayModalResult = {
      name: this.name.trim(),
      status: this.status,
      currentOperator: this.status === 'active' ? this.operatorName : null,
    };

    this.dialogRef.close(result);
  }
}
