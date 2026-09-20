import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { ConfirmModal, ConfirmModalData } from '../../../../shared/dialogs/confirm-modal/confirm-modal';
import { ScheduleExceptionModal, ScheduleExceptionData, ScheduleExceptionResult } from '../../../../shared/dialogs/schedule-exception-modal/schedule-exception-modal';
import { ScheduleHistoryModal, ScheduleHistoryEntry } from '../../../../shared/dialogs/schedule-history-modal/schedule-history-modal';

type ScheduleTab = 'hours' | 'bays';
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type PauseType = 'none' | 'lunch';

interface DaySchedule {
  key: DayKey;
  isWorking: boolean;
  openTime: string;
  closeTime: string;
  pause: PauseType;
}

interface ScheduleException {
  id: string;
  date: string;
  type: 'holiday' | 'special';
  closedAllDay: boolean;
  openTime: string;
  closeTime: string;
  reason: string;
}


interface WashBay {
  id: string;
  name: string;
  status: 'active' | 'maintenance' | 'inactive';
  currentOperator: string | null;
}

const DAY_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class ScheduleComponent {

  activeTab: ScheduleTab = 'hours';

  weeklySchedule: DaySchedule[] = [
    { key: 'monday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
    { key: 'tuesday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
    { key: 'wednesday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
    { key: 'thursday', isWorking: true, openTime: '07:30', closeTime: '18:30', pause: 'none' },
    { key: 'friday', isWorking: true, openTime: '07:30', closeTime: '19:00', pause: 'none' },
    { key: 'saturday', isWorking: true, openTime: '08:00', closeTime: '18:00', pause: 'none' },
    { key: 'sunday', isWorking: false, openTime: '08:00', closeTime: '14:00', pause: 'none' },
  ];

  // snapshot para poder "Restablecer valores"
  private savedSchedule: DaySchedule[] = this.weeklySchedule.map(d => ({ ...d }));

  exceptions: ScheduleException[] = [
    { id: 'ex1', date: '2026-11-11', type: 'holiday', closedAllDay: true, openTime: '', closeTime: '', reason: 'Día de la Independencia de Cartagena' },
    { id: 'ex2', date: '2026-12-08', type: 'special', closedAllDay: false, openTime: '09:00', closeTime: '14:00', reason: 'Inmaculada Concepción · Jornada corta' },
    { id: 'ex3', date: '2026-12-25', type: 'holiday', closedAllDay: true, openTime: '', closeTime: '', reason: 'Navidad - No laboral obligatorio' },
  ];

  bays: WashBay[] = [
    { id: 'b1', name: 'Bahía 1', status: 'active', currentOperator: 'Juan Díaz' },
    { id: 'b2', name: 'Bahía 2', status: 'active', currentOperator: 'Carlos Ruiz' },
    { id: 'b3', name: 'Bahía 3', status: 'active', currentOperator: null },
    { id: 'b4', name: 'Bahía 4', status: 'maintenance', currentOperator: null },
  ];

  private historyEntries: ScheduleHistoryEntry[] = [
    { date: '15/09/2026', author: 'Laura Méndez', description: 'Se amplió el horario del viernes hasta las 7:00 PM' },
    { date: '02/09/2026', author: 'Laura Méndez', description: "Se agregó la excepción 'Navidad - No laboral obligatorio'" },
    { date: '20/08/2026', author: 'Laura Méndez', description: 'Bahía 4 pasó a mantenimiento programado' },
  ];

  constructor(private dialog: MatDialog) {}

  get orderedSchedule(): DaySchedule[] {
    return DAY_ORDER.map(key => this.weeklySchedule.find(d => d.key === key)!);
  }

  get activeBaysCount(): number {
    return this.bays.filter(b => b.status === 'active').length;
  }

  // texto del badge "Abierto hoy · 08:00 - 18:00" del encabezado
  get todayLabel(): string {
    const jsWeekday = new Date().getDay(); // 0 = domingo
    const order: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = this.weeklySchedule.find(d => d.key === order[jsWeekday]);

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
  }

  saveSchedule(): void {
    this.savedSchedule = this.weeklySchedule.map(d => ({ ...d }));
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
      if (!result) return;

      this.exceptions = [
        ...this.exceptions,
        { id: 'ex' + (this.exceptions.length + 1), ...result }
      ];
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

      exception.date = result.date;
      exception.type = result.type;
      exception.closedAllDay = result.closedAllDay;
      exception.openTime = result.openTime;
      exception.closeTime = result.closeTime;
      exception.reason = result.reason;
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
      if (!confirmed) return;
      this.exceptions = this.exceptions.filter(e => e.id !== exception.id);
    });
  }

  // --- bahías ---

  cycleBayStatus(bay: WashBay): void {
    const order: WashBay['status'][] = ['active', 'maintenance', 'inactive'];
    const next = order[(order.indexOf(bay.status) + 1) % order.length];
    bay.status = next;
    if (next !== 'active') bay.currentOperator = null;
  }
}
