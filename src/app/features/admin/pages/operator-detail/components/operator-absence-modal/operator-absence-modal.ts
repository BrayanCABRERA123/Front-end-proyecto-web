import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface AbsenceModalResult {
  startDate: string;
  endDate: string;
  reason: string;
}

@Component({
  selector: 'app-operator-absence-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './operator-absence-modal.html',
  styleUrl: './operator-absence-modal.scss',
})
export class OperatorAbsenceModal {

  startDate = new Date().toISOString().slice(0, 10);
  endDate = new Date().toISOString().slice(0, 10);
  reason = '';

  submitted = false;

  constructor(private dialogRef: MatDialogRef<OperatorAbsenceModal>) {}

  get dateInvalid(): boolean {
    return this.submitted && this.endDate < this.startDate;
  }

  get reasonInvalid(): boolean {
    return this.submitted && this.reason.trim().length < 3;
  }

  get canSave(): boolean {
    return this.endDate >= this.startDate && this.reason.trim().length >= 3;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (!this.canSave) return;

    const result: AbsenceModalResult = {
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason.trim(),
    };

    this.dialogRef.close(result);
  }
}