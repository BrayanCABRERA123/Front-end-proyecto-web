import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ServiceHistoryItem,
  historyStatusClass,
  historyStatusIcon,
  historyStatusLabel
} from '../history-models/service-history.model';

@Component({
  selector: 'app-service-history-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './service-history-detail-modal.html',
  styleUrl: './service-history-detail-modal.scss'
})
export class ServiceHistoryDetailModal {

  statusClass = historyStatusClass;
  statusIcon = historyStatusIcon;
  statusLabel = historyStatusLabel;

  stars = [1, 2, 3, 4, 5];

  constructor(
    private dialogRef: MatDialogRef<ServiceHistoryDetailModal>,
    @Inject(MAT_DIALOG_DATA) public service: ServiceHistoryItem
  ) {}

  close() {
    this.dialogRef.close();
  }
}
