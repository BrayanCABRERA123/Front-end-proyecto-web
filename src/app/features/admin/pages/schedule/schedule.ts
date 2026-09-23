import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ScheduleExceptionModal, ScheduleExceptionData, ScheduleExceptionResult } from '../../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { ScheduleHistoryModal, ScheduleHistoryEntry } from '../../../../shared/dialogs/schedule-history-modal/schedule-history-modal';
import {
  AdminSchedule,
  AdminScheduleService,
  DayKey,
  DaySchedule,
  ScheduleException,
  WashBay
} from '../../../../core/services/admin-schedule';

type ScheduleTab = 'hours' | 'bays';

const DAY_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent implements OnInit {

  activeTab: ScheduleTab = 'hours';

  // todo viene del mock (GET /admin/schedule) y cada cambio se guarda allá
  weeklySchedule: DaySchedule[] = [];

  // snapshot de lo guardado, para "Restablecer valores"
  private savedSchedule: DaySchedule[] = [];

  exceptions: ScheduleException[] = [];
  bays: WashBay[] = [];
  private historyEntries: ScheduleHistoryEntry[] = [];

  // mensaje del mock API (horas inválidas, fecha repetida, etc.)
  errorMessage: string | null = null;

  constructor(
    private dialog: MatDialog,
    private scheduleService: AdminScheduleService
  ) {}

  ngOnInit(): void {
    this.run(this.scheduleService.get$());
  }

  // aplica la respuesta del mock (siempre trae el estado completo) o muestra su error
  private run(request$: Observable<AdminSchedule>): void {
    request$.subscribe({
      next: schedule => {
        this.errorMessage = null;
        this.weeklySchedule = schedule.weeklySchedule;
        this.savedSchedule = schedule.weeklySchedule.map(d => ({ ...d }));
        this.exceptions = schedule.exceptions;
        this.bays = schedule.bays;
        this.historyEntries = schedule.history;
      },
      error: (err: HttpErrorResponse) => (this.errorMessage = err.error?.message ?? 'Error')
    });
  }

  get orderedSchedule(): DaySchedule[] {
    return DAY_ORDER.map(key => this.weeklySchedule.find(d => d.key === key)).filter((d): d is DaySchedule => !!d);
  }

  get activeBaysCount(): number {
    return this.bays.filter(b => b.status === 'active').length;
  }

  // texto del badge "Abierto hoy · 08:00 - 18:00" del encabezado (según lo guardado)
  get todayLabel(): string {
    const jsWeekday = new Date().getDay(); // 0 = domingo
    const order: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = this.savedSchedule.find(d => d.key === order[jsWeekday]);

    if (!today || !today.isWorking) return '';
    return `${today.openTime} - ${today.closeTime}`;
  }

  get isOpenToday(): boolean {
    return this.todayLabel !== '';
  }

  setTab(tab: ScheduleTab): void {
    this.activeTab = tab;
  }

  toggleDay(day: DaySchedule): void {
    day.isWorking = !day.isWorking;
  }

  resetSchedule(): void {
    this.weeklySchedule = this.savedSchedule.map(d => ({ ...d }));
    this.errorMessage = null;
  }

  saveSchedule(): void {
    this.run(this.scheduleService.saveHours$(this.weeklySchedule));
  }

  openHistory(): void {
    this.dialog.open(ScheduleHistoryModal, {
      panelClass: 'custom-dialog',
      data: this.historyEntries
    });
  }

  // --- excepciones ---

  openAddException(): void {
    const dialogRef = this.dialog.open(ScheduleExceptionModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: ScheduleExceptionResult | null) => {
      if (result) this.run(this.scheduleService.addException$(result));
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
      if (result) this.run(this.scheduleService.updateException$(exception.id, result));
    });
  }

  deleteException(exception: ScheduleException): void {
    const data: ConfirmModalData = {
      title: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.TITLE',
      message: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.MESSAGE',
      confirmText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CONFIRM',
      cancelText: 'ADMIN_MANAGEMENT.DELETE_CONFIRM.CANCEL',
      danger: true
    };

    const dialogRef = this.dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.run(this.scheduleService.deleteException$(exception.id));
    });
  }

  // --- bahías ---

  cycleBayStatus(bay: WashBay): void {
    const order: WashBay['status'][] = ['active', 'maintenance', 'inactive'];
    const next = order[(order.indexOf(bay.status) + 1) % order.length];
    this.run(this.scheduleService.setBayStatus$(bay.id, next));
  }
}
