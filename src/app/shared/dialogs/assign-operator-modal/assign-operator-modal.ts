import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import {
  AssignOperatorModalData,
  AssignOperatorResult,
  AvailableOperator
} from './assign-operator.model';

@Component({
  selector: 'app-assign-operator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './assign-operator-modal.html',
  styleUrl: './assign-operator-modal.scss'
})
export class AssignOperatorModal {

  // operario seleccionado con el radio, arranca en el primero disponible
  selectedOperatorId: string;
  notes = '';

  constructor(
    private dialogRef: MatDialogRef<AssignOperatorModal>,
    @Inject(MAT_DIALOG_DATA) public data: AssignOperatorModalData
  ) {
    const firstAvailable = data.operators.find(o => o.availability === 'available');
    this.selectedOperatorId = firstAvailable?.id ?? '';
  }

  canPick(operator: AvailableOperator): boolean {
    return operator.availability === 'available';
  }

  pickOperator(operator: AvailableOperator): void {
    if (!this.canPick(operator)) return;
    this.selectedOperatorId = operator.id;
  }

  close(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    if (!this.selectedOperatorId) return;

    const result: AssignOperatorResult = {
      operatorId: this.selectedOperatorId,
      notes: this.notes.trim()
    };

    this.dialogRef.close(result);
  }
}
