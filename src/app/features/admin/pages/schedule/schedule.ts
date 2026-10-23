import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ScheduleExceptionModal, ScheduleExceptionData, ScheduleExceptionResult } from '../../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { WashBayModal, WashBayModalData, WashBayModalResult } from './components/bay-modal/bay-modal';
import { ScheduleException, WashBay } from '../../models/admin.models';
import { ScheduleViewModel } from '../../viewmodels/schedule.viewmodel';

// vista de Horarios y bahías: los datos y las acciones están en ScheduleViewModel; aquí quedan
// los modales y las confirmaciones de borrado
@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  providers: [ScheduleViewModel],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent implements OnInit {

  readonly vm = inject(ScheduleViewModel);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.vm.load();
  }

  /* ---------- excepciones ---------- */

  openAddException(): void {
    this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog' })
      .afterClosed()
      .subscribe((result: ScheduleExceptionResult | null) => {
        if (result) this.vm.addException(result);
      });
  }

  openEditException(exception: ScheduleException): void {
    const data: ScheduleExceptionData = {
      date: exception.date,
      closedAllDay: exception.closedAllDay,
      openTime: exception.openTime,
      closeTime: exception.closeTime,
      reason: exception.reason
    };
    this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: ScheduleExceptionResult | null) => {
        if (result) this.vm.updateException(exception, result);
      });
  }

  deleteException(exception: ScheduleException): void {
    this.confirmDelete({
      title: 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETE_TITLE',
      message: 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETE_MESSAGE',
      messageParams: { reason: exception.reason },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true
    }, () => this.vm.removeException(exception));
  }

  /* ---------- bahías ---------- */

  openAddBay(): void {
    this.dialog.open(WashBayModal, { panelClass: 'custom-dialog' })
      .afterClosed()
      .subscribe((result: WashBayModalResult | null) => {
        if (result) this.vm.addBay(result);
      });
  }

  openEditBay(bay: WashBay): void {
    const data: WashBayModalData = { ...bay };
    this.dialog.open(WashBayModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: WashBayModalResult | null) => {
        if (result) this.vm.updateBay(bay, result);
      });
  }

  deleteBay(bay: WashBay): void {
    this.confirmDelete({
      title: 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETE_TITLE',
      message: 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETE_MESSAGE',
      messageParams: { name: bay.name },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true
    }, () => this.vm.removeBay(bay));
  }

  private confirmDelete(data: ConfirmModalData, onConfirm: () => void): void {
    this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) onConfirm();
      });
  }
}
