import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ScheduleExceptionModal, ScheduleExceptionData, ScheduleExceptionResult } from '../../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { WashBayModal, WashBayModalData, WashBayModalResult } from './components/bay-modal/bay-modal';
import { apiErrorKey } from '../../../../core/utils/api-error';
import { BayStatus, DayKey, DaySchedule, ScheduleException, WashBay } from '../../models/admin.models';
import { ScheduleStore } from '../../services/schedule-store';

type ScheduleTab = 'hours' | 'bays';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent implements OnInit {

  activeTab: ScheduleTab = 'hours';

  // opciones del desplegable de estado de una bahía: solo tres, sin más
  readonly bayStatuses: { value: BayStatus; labelKey: string; icon: string }[] = [
    { value: 'active', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.active', icon: 'check_circle' },
    { value: 'inactive', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.inactive', icon: 'pause_circle' },
    { value: 'maintenance', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.maintenance', icon: 'build' },
  ];

  constructor(
    private dialog: MatDialog,
    private store: ScheduleStore,
    private feedback: FeedbackService,
    private translate: TranslateService,
  ) {}

  // se recarga al entrar para ver lo último que guardó cualquier admin
  ngOnInit(): void {
    this.store.load();
  }

  get loading(): boolean { return this.store.loading(); }
  get loadError(): string | null { return this.store.loadError(); }

  reload(): void {
    this.store.load();
  }

  private showError(error: unknown): void {
    this.feedback.error('COMMON.ERROR', apiErrorKey(error));
  }

  /* ---------- datos que vienen del store ---------- */

  get orderedSchedule(): DaySchedule[] { return this.store.orderedSchedule(); }
  get exceptions(): ScheduleException[] { return this.store.exceptions(); }
  get bays(): WashBay[] { return this.store.bays(); }
  get activeBaysCount(): number { return this.store.activeBaysCount(); }

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

  setDayTime(key: DayKey, field: 'openTime' | 'closeTime' | 'breakStart' | 'breakEnd', value: string): void {
    this.store.setDayField(key, field, value);
  }

  setDayPause(key: DayKey, value: DaySchedule['pause']): void {
    this.store.setDayPause(key, value === 'lunch');
  }

  resetSchedule(): void {
    // vuelve a lo que está guardado en el backend
    this.store.load();
    this.feedback.info('ADMIN_SCHEDULE.FEEDBACK.RESET_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.RESET_MESSAGE');
  }

  saveSchedule(): void {
    this.store.saveSchedule().subscribe({
      next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.SAVED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.SAVED_MESSAGE'),
      error: (error) => this.showError(error)
    });
  }

  /* ---------- excepciones ---------- */

  openAddException(): void {
    const dialogRef = this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: ScheduleExceptionResult | null) => {
      if (!result) return;
      this.store.addException(result).subscribe({
        next: (created) => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_MESSAGE', { messageParams: { reason: created.reason } }),
        error: (error) => this.showError(error)
      });
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

    const dialogRef = this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: ScheduleExceptionResult | null) => {
      if (!result) return;
      this.store.updateException(exception.id, result).subscribe({
        next: (updated) => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_MESSAGE', { messageParams: { reason: updated.reason } }),
        error: (error) => this.showError(error)
      });
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
      this.store.removeException(exception.id).subscribe({
        next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_MESSAGE'),
        error: (error) => this.showError(error)
      });
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

    this.store.setBayStatus(bay.id, status).subscribe({
      next: () => this.feedback.success(
        'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE',
        'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE',
        {
          details: [
            { label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: bay.name },
            { label: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS_LABEL', value: this.translate.instant(this.statusLabelKey(status)) }
          ]
        }
      ),
      error: (error) => this.showError(error)
    });
  }

  openAddBay(): void {
    const dialogRef = this.dialog.open(WashBayModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: WashBayModalResult | null) => {
      if (!result) return;
      this.store.addBay(result.name, result.status).subscribe({
        next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_MESSAGE', {
          details: [{ label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: result.name }]
        }),
        error: (error) => this.showError(error)
      });
    });
  }

  openEditBay(bay: WashBay): void {
    const data: WashBayModalData = { ...bay };
    const dialogRef = this.dialog.open(WashBayModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: WashBayModalResult | null) => {
      if (!result) return;
      this.store.updateBay(bay.id, result).subscribe({
        next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE', {
          details: [{ label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: result.name }]
        }),
        error: (error) => this.showError(error)
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
      this.store.removeBay(bay.id).subscribe({
        next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_MESSAGE'),
        error: (error) => this.showError(error)
      });
    });
  }
}
