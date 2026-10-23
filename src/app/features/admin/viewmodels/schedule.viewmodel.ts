import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { ScheduleExceptionResult } from '../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { apiErrorKey } from '../../../core/utils/api-error';
import { BayStatus, DayKey, DaySchedule, ScheduleException, WashBay } from '../models/admin.models';
import { ScheduleStore } from '../services/schedule-store';
import { WashBayModalResult } from '../pages/schedule/components/bay-modal/bay-modal';

export type ScheduleTab = 'hours' | 'bays';

/**
 * Horarios y bahías: horario semanal (se edita en memoria y se guarda completo), excepciones y
 * bahías (se guardan una por una). El store de horarios es el estado compartido del admin.
 */
@Injectable()
export class ScheduleViewModel {

  private readonly store = inject(ScheduleStore);
  private readonly feedback = inject(FeedbackService);
  private readonly translate = inject(TranslateService);

  activeTab: ScheduleTab = 'hours';

  // opciones del desplegable de estado de una bahía: solo tres, sin más
  readonly bayStatuses: { value: BayStatus; labelKey: string; icon: string }[] = [
    { value: 'active', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.active', icon: 'check_circle' },
    { value: 'inactive', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.inactive', icon: 'pause_circle' },
    { value: 'maintenance', labelKey: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.maintenance', icon: 'build' },
  ];

  // se recarga al entrar para ver lo último que guardó cualquier admin
  load(): void {
    this.store.load();
  }

  get loading(): boolean { return this.store.loading(); }
  get loadError(): string | null { return this.store.loadError(); }
  get orderedSchedule(): DaySchedule[] { return this.store.orderedSchedule(); }
  get exceptions(): ScheduleException[] { return this.store.exceptions(); }
  get bays(): WashBay[] { return this.store.bays(); }
  get activeBaysCount(): number { return this.store.activeBaysCount(); }

  /* ---------- encabezado ---------- */

  get todayLabel(): string {
    // la excepción del día manda sobre el horario semanal (igual que en booking-service)
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const exception = this.store.exceptions().find(e => e.date === todayIso);
    if (exception) {
      return exception.closedAllDay ? '' : `${exception.openTime} - ${exception.closeTime}`;
    }
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

  // vuelve a lo que está guardado en el backend
  resetSchedule(): void {
    this.store.load();
    this.feedback.info('ADMIN_SCHEDULE.FEEDBACK.RESET_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.RESET_MESSAGE');
  }

  saveSchedule(): void {
    this.store.saveSchedule().subscribe({
      next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.SAVED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.SAVED_MESSAGE'),
      error: (error: unknown) => this.showError(error)
    });
  }

  /* ---------- excepciones ---------- */

  addException(result: ScheduleExceptionResult): void {
    this.store.addException(result).subscribe({
      next: created => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_ADDED_MESSAGE',
        { messageParams: { reason: created.reason } }),
      error: (error: unknown) => this.showError(error)
    });
  }

  updateException(exception: ScheduleException, result: ScheduleExceptionResult): void {
    this.store.updateException(exception.id, result).subscribe({
      next: updated => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_UPDATED_MESSAGE',
        { messageParams: { reason: updated.reason } }),
      error: (error: unknown) => this.showError(error)
    });
  }

  removeException(exception: ScheduleException): void {
    this.store.removeException(exception.id).subscribe({
      next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.EXCEPTION_DELETED_MESSAGE'),
      error: (error: unknown) => this.showError(error)
    });
  }

  /* ---------- bahías ---------- */

  statusIcon(status: BayStatus): string {
    return this.bayStatuses.find(s => s.value === status)?.icon ?? 'help';
  }

  statusLabelKey(status: BayStatus): string {
    return 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS.' + status;
  }

  // cambio de estado desde el desplegable de la tarjeta, sin recargar la página
  changeBayStatus(bay: WashBay, status: BayStatus): void {
    if (status === bay.status) return;
    this.store.setBayStatus(bay.id, status).subscribe({
      next: updated => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE',
        { messageParams: { name: updated.name }, details: this.bayDetails(updated) }),
      error: (error: unknown) => this.showError(error)
    });
  }

  // el resumen sale de la bahía que devolvió el backend, no de lo que se escribió
  addBay(result: WashBayModalResult): void {
    this.store.addBay(result.name, result.status).subscribe({
      next: created => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_ADDED_MESSAGE',
        { messageParams: { name: created.name }, details: this.bayDetails(created) }),
      error: (error: unknown) => this.showError(error)
    });
  }

  updateBay(bay: WashBay, result: WashBayModalResult): void {
    this.store.updateBay(bay.id, result).subscribe({
      next: updated => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_UPDATED_MESSAGE',
        { messageParams: { name: updated.name }, details: this.bayDetails(updated) }),
      error: (error: unknown) => this.showError(error)
    });
  }

  removeBay(bay: WashBay): void {
    this.store.removeBay(bay.id).subscribe({
      next: () => this.feedback.success('ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_TITLE', 'ADMIN_SCHEDULE.FEEDBACK.BAY_DELETED_MESSAGE'),
      error: (error: unknown) => this.showError(error)
    });
  }

  private bayDetails(bay: WashBay): { label: string; value: string }[] {
    return [
      { label: 'ADMIN_SCHEDULE.BAYS_SECTION.NAME_LABEL', value: bay.name },
      { label: 'ADMIN_SCHEDULE.BAYS_SECTION.STATUS_LABEL', value: this.translate.instant(this.statusLabelKey(bay.status)) }
    ];
  }

  private showError(error: unknown): void {
    this.feedback.error('COMMON.ERROR', apiErrorKey(error));
  }
}
