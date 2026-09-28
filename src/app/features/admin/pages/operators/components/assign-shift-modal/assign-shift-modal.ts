import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { OperatorStatus } from '../../../../models/admin.models';

export interface AssignShiftOperator {
  id: string;
  name: string;
  initials: string;
  status: OperatorStatus;
}

export interface AssignShiftModalData {
  operators: AssignShiftOperator[];
  bays: { id: string; name: string }[];
}

export interface AssignShiftResult {
  operatorId: string;
  status: OperatorStatus;
  bay: string | null;
}

@Component({
  selector: 'app-assign-shift-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './assign-shift-modal.html',
  styleUrl: './assign-shift-modal.scss',
})
export class AssignShiftModal {

  operatorId = '';
  status: OperatorStatus = 'available';
  bay: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<AssignShiftModal>,
    @Inject(MAT_DIALOG_DATA) public data: AssignShiftModalData,
  ) {
    this.operatorId = this.data.operators[0]?.id ?? '';
  }

  get selectedOperator(): AssignShiftOperator | undefined {
    return this.data.operators.find(o => o.id === this.operatorId);
  }

  // una baja médica siempre libera la bahía
  get bayDisabled(): boolean {
    return this.status === 'medical_leave';
  }

  get canAssign(): boolean {
    return !!this.operatorId;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  assign(): void {
    if (!this.canAssign) return;

    const result: AssignShiftResult = {
      operatorId: this.operatorId,
      status: this.status,
      bay: this.status === 'medical_leave' ? null : this.bay,
    };

    this.dialogRef.close(result);
  }
}