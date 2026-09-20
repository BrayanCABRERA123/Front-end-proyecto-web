import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface ScheduleHistoryEntry {
  date: string;
  author: string;
  description: string;
}

@Component({
  selector: 'app-schedule-history-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './schedule-history-modal.html',
  styleUrl: './schedule-history-modal.scss'
})
export class ScheduleHistoryModal {

  constructor(
    private dialogRef: MatDialogRef<ScheduleHistoryModal>,
    @Inject(MAT_DIALOG_DATA) public entries: ScheduleHistoryEntry[]
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
