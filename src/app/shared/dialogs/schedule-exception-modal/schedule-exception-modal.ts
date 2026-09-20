import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export type ExceptionType = 'holiday' | 'special';

export interface ScheduleExceptionData {
  date: string;
  type: ExceptionType;
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

  date = '';
  type: ExceptionType = 'holiday';
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
      this.type = data.type;
      this.closedAllDay = data.closedAllDay;
      this.openTime = data.openTime;
      this.closeTime = data.closeTime;
      this.reason = data.reason;
    }
  }

  get canSave(): boolean {
    return this.date.trim().length > 0 && this.reason.trim().length > 0;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (!this.canSave) return;

    const result: ScheduleExceptionResult = {
      date: this.date,
      type: this.type,
      closedAllDay: this.closedAllDay,
      openTime: this.openTime,
      closeTime: this.closeTime,
      reason: this.reason.trim()
    };

    this.dialogRef.close(result);
  }
}
