import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AvailabilitySlot } from '../../../../models/admin.models';

export interface AvailabilityModalData {
  /** disponibilidad actual del operario, para precargar el formulario */
  slots: AvailabilitySlot[];
}

export interface DayRow {
  day: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

// 0 = lunes ... 6 = domingo
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

@Component({
  selector: 'app-availability-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './availability-modal.html',
  styleUrl: './availability-modal.scss',
})
export class AvailabilityModal {

  dayKeys = DAY_KEYS;

  rows: DayRow[];

  submitted = false;

  constructor(
    private dialogRef: MatDialogRef<AvailabilityModal>,
    @Inject(MAT_DIALOG_DATA) public data: AvailabilityModalData,
  ) {
    // ojo: se arma en el constructor y NO como inicializador de campo, porque
    // los field initializers corren antes de que Angular asigne this.data
    this.rows = DAY_KEYS.map((_, day) => {
      const slot = this.data.slots.find(s => s.day === day);
      return {
        day,
        enabled: !!slot,
        startTime: slot?.startTime ?? '08:00',
        endTime: slot?.endTime ?? '18:00',
      };
    });
  }

  get hasInvalidRow(): boolean {
    return this.rows.some(r => r.enabled && r.endTime <= r.startTime);
  }

  get canSave(): boolean {
    return !this.hasInvalidRow;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const slots: AvailabilitySlot[] = this.rows
      .filter(r => r.enabled)
      .map(r => ({ day: r.day, startTime: r.startTime, endTime: r.endTime }));

    this.dialogRef.close(slots);
  }
}