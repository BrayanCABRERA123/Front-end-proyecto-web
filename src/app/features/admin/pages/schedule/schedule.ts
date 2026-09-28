import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ScheduleExceptionModal, ScheduleExceptionData, ScheduleExceptionResult } from '../../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { ScheduleHistoryModal } from '../../../../shared/dialogs/schedule-history-modal/schedule-history-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { BayOperatorOption, WashBayModal, WashBayModalData, WashBayModalResult } from './components/bay-modal/bay-modal';
import { BayStatus, DayKey, DaySchedule, ScheduleException, WashBay } from '../../models/admin.models';
import { OperatorsStore } from '../../services/operators-store';
import { ScheduleStore } from '../../services/schedule-store';

type ScheduleTab = 'hours' | 'bays';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent {

  activeTab: ScheduleTab = 'hours';

  // se rellena en el constructor con el horario guardado
  private savedSchedule: DaySchedule[] = [];

  // opciones del desplegable de estado de una bahía: solo tres, sin más
  readonly bayStatuses: { value: BayStatus; labelKey: string; icon: string }[] = [
    { value: 'active', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.active', icon: 'check_circle' },
    { value: 'inactive', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.inactive', icon: 'pause_circle' },
    { value: 'maintenance', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.maintenance', icon: 'build' },
  ];

  constructor(
    private dialog: MatDialog,
    private store: ScheduleStore,
    private operators: OperatorsStore,
    private feedback: FeedbackService,
    private translate: TranslateService,
  ) {
    // copia del horario tal como quedó guardado; sirve para "Restablecer valores"
    this.savedSchedule = this.store.weeklySchedule().map(d => ({ ...d }));
  }

  /* ---------- datos que vienen del store ---------- */

  get orderedSchedule(): DaySchedule[] { return this.store.orderedSchedule(); }
  get exceptions(): ScheduleException[] { return this.store.exceptions(); }
  get bays(): WashBay[] { return this.store.bays(); }
  get activeBaysCount(): number { return this.store.activeBaysCount(); }

  // operarios que se pueden asignar a una bahía activa
  private get bayOperators(): BayOperatorOption[] {
    return this.operators
      .availableOperators()
      .map(o => ({ id: o.id, name: o.name }));
  }

  /* ---------- encabezado ---------- */

  get todayLabel(): string {
    const today = this.store.getTodaySchedule();
    if (!today || !today.isWorking) return '';
    return `${today.openTime} - ${today.closeTime}`;
  }

  get isOpenToday(): boolean {
    return this.todayLabel !== '';
  }

  setTab(tab: ScheduleTab): void {
    this.activeTab = tab;
  }

  /* ---------- horario semanal ---------- */

  toggleDay(key: DayKey): void {
    this.store.toggleDay(key);
  }

  setDayTime(key: DayKey, field: 'openTime' | 'closeTime', value: string): void {
    this.store.setDayField(key, field, value);
  }

  setDayPause(key: DayKey, value: DaySchedule['pause']): void {
    this.store.setDayField(key, 'pause', value);
  }

  resetSchedule(): void {
    this.store.resetSchedule(this.savedSchedule);
    this.feedback.info('ADMIN_SCHEDULE.FEEDBACK.RESET_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.RESET_MESSAGE');
  }

  saveSchedule(): void {
    this.savedSchedule = this.store.saveSchedule();
    this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.SAVED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.SAVED_MESSAGE');
  }

  openHistory(): void {
    this.dialog.open(ScheduleHistoryModal, {
      panelClass: 'custom-dialog',
      data: this.store.history()
    });
  }

  /* ---------- excepciones ---------- */

  openAddException(): void {
    const dialogRef = this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: ScheduleExceptionResult | null) => {
      if (!result) return;
      this.store.addException(result);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_MESSAGE');
    });
  }

  openEditException(exception: ScheduleException): void {
    const data: ScheduleExceptionData = {
      date: exception.date,
      type: exception.type,
      closedAllDay: exception.closedAllDay,
      openTime: exception.openTime,
      closeTime: exception.closeTime,
      reason: exception.reason
    };

    const dialogRef = this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: ScheduleExceptionResult | null) => {
      if (!result) return;
      this.store.updateException(exception.id, result);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_MESSAGE');
    });
  }

  deleteException(exception: ScheduleException): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETE_TITLE',
      message: 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETE_MESSAGE',
      messageParams: { reason: exception.reason },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.store.removeException(exception.id);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_MESSAGE');
    });
  }

  /* ---------- bahías ---------- */

  statusIcon(status: BayStatus): string {
    return this.bayStatuses.find(s => s.value === status)?.icon ?? 'help';
  }

  statusLabelKey(status: BayStatus): string {
    return 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.' + status;
  }

  /**
   * Cambio de estado desde el desplegable de la tarjeta.
   * Se actualiza el store (y por lo tanto la interfaz y los datos locales)
   * sin recargar la página, y se confirma la acción con el feedback común.
   */
  changeBayStatus(bay: WashBay, status: BayStatus): void {
    if (status === bay.status) return;

    this.store.setBayStatus(bay.id, status);

    this.feedback.success(
      'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE',
      'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE',
      {
        details: [
          { label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: bay.name },
          { label: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS_LABEL', value: this.translate.instant(this.statusLabelKey(status)) }
        ]
      }
    );
  }

  openAddBay(): void {
    const dialogRef = this.dialog.open(WashBayModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: WashBayModalResult | null) => {
      if (!result) return;
      this.store.addBay(result.name, result.status, result.currentOperator);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_MESSAGE', {
        details: [{ label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: result.name }]
      });
    });
  }

  openEditBay(bay: WashBay): void {
    const data: WashBayModalData = { ...bay, operators: this.bayOperators };
    const dialogRef = this.dialog.open(WashBayModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: WashBayModalResult | null) => {
      if (!result) return;
      this.store.updateBay(bay.id, result);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE', {
        details: [{ label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: result.name }]
      });
    });
  }

  deleteBay(bay: WashBay): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETE_TITLE',
      message: 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETE_MESSAGE',
      messageParams: { name: bay.name },
      confirmText: 'COMMON.DELETE',
      cancelText: 'COMMON.CANCEL',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.store.removeBay(bay.id);
      this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_MESSAGE');
    });
  }
}
