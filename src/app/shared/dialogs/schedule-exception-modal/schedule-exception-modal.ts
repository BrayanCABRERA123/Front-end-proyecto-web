import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { todayIso } from '../../../core/utils/dates';

export type ExceptionType = 'holiday' | 'special';

export interface ScheduleExceptionData {
  date: string;
  closedAllDay: boolean;
  openTime: string;
  closeTime: string;
  reason: string;
}

export type ScheduleExceptionResult = ScheduleExceptionData;

@Component({
  selector: 'app-schedule-exception-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './schedule-exception-modal.html',
  styleUrl: './schedule-exception-modal.scss'
})
export class ScheduleExceptionModal {

  isEditing = false;

  readonly minDate = todayIso();

  date = '';
  closedAllDay = true;
  openTime = '09:00';
  closeTime = '14:00';
  reason = '';

  constructor(
    private dialogRef: MatDialogRef<ScheduleExceptionModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) data: ScheduleExceptionData | null
  ) {
    if (data) {
      this.isEditing = true;
      this.date = data.date;
      this.closedAllDay = data.closedAllDay;
      this.openTime = data.openTime;
      this.closeTime = data.closeTime;
      this.reason = data.reason;
    }
  }

  // si abre ese día, el cierre debe ser después de la apertura (booking-service lo exige igual)
  get hasInvalidRange(): boolean {
    return !this.closedAllDay && (!this.openTime || !this.closeTime || this.closeTime <= this.openTime);
  }

  get canSave(): boolean {
    return !this.isPastDate && this.date.trim().length > 0 && this.reason.trim().length > 0 && !this.hasInvalidRange;
  }

  get isPastDate(): boolean {
    return !!this.date && this.date < this.minDate;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave) return;

    const result: ScheduleExceptionResult = {
      date: this.date,
      closedAllDay: this.closedAllDay,
      openTime: this.openTime,
      closeTime: this.closeTime,
      reason: this.reason.trim()
    };

    this.dialogRef.close(result);
  }
}
