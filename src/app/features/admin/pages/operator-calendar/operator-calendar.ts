import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { Operator, OperatorsStore } from '../../services/operators-store';
import { isoDay, todayIso } from '../../../../core/utils/dates';

type CalendarView = 'week' | 'day' | 'month';

// lunes = 0 ... domingo = 6 (igual que la disponibilidad del operario)
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const LOCALES: Record<string, string> = { es: 'es-CO', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };

/** lo que el operario tiene en una fecha concreta */
export interface DayEntry {
  type: 'available' | 'leave';
  startTime?: string;
  endTime?: string;
  label: string;
}

export interface MonthCell {
  iso: string | null;
  day: number | null;
  isToday: boolean;
  isPast: boolean;
  kind: 'available' | 'leave' | 'off' | null;
}

@Component({
  selector: 'app-operator-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './operator-calendar.html',
  styleUrl: './operator-calendar.scss'
})
export class OperatorCalendarComponent implements OnInit {

  private operatorId = '';
  view: CalendarView = 'week';

  // la semana completa, de lunes a domingo
  readonly dayIndexes = [0, 1, 2, 3, 4, 5, 6];

  // semana visible: 0 = la actual, +1 la siguiente, -1 la anterior...
  weekOffset = 0;

  // día visible en la vista "Día" (lunes = 0 ... domingo = 6)
  selectedDayIndex = 0;

  // mes visible en la vista "Mes" (siempre el día 1)
  monthViewDate = this.firstOfMonth(new Date());

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: OperatorsStore,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // reactivo: al navegar entre fichas cambia el id sin recargar
    this.route.paramMap.subscribe(params => {
      this.operatorId = params.get('id') ?? '';
      this.selectedDayIndex = this.weekdayOf(new Date());
    });
  }

  // se lee del store cada vez: así el calendario funciona aunque se abra o recargue
  // antes de que lleguen los operarios (antes salía "Operario no encontrado")
  get operator(): Operator | undefined {
    return this.store.getById(this.operatorId);
  }

  get loading(): boolean {
    return !this.store.loaded();
  }

  /* ---------- fechas ---------- */

  private get locale(): string {
    return LOCALES[this.translate.currentLang ?? 'es'] ?? 'es-CO';
  }

  private weekdayOf(date: Date): number {
    return (date.getDay() + 6) % 7;
  }

  private firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /** lunes de la semana visible */
  private get mondayOfVisibleWeek(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - this.weekdayOf(now) + this.weekOffset * 7);
  }

  dateOfDay(dayIndex: number): Date {
    const monday = this.mondayOfVisibleWeek;
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayIndex);
  }

  private fmt(date: Date, withYear = false): string {
    return date.toLocaleDateString(this.locale, withYear
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short' });
  }

  isToday(dayIndex: number): boolean {
    return isoDay(this.dateOfDay(dayIndex)) === todayIso();
  }

  isPast(dayIndex: number): boolean {
    return isoDay(this.dateOfDay(dayIndex)) < todayIso();
  }

  get weekLabelContent(): { week: number; from: string; to: string } {
    const monday = this.mondayOfVisibleWeek;
    // número de semana ISO: la semana del jueves
    const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
    const week = Math.ceil(((thursday.getTime() - new Date(thursday.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);

    return {
      week,
      from: this.fmt(monday),
      to: this.fmt(this.dateOfDay(6), true),
    };
  }

  /* ---------- etiquetas ---------- */

  // jornada laboral calculada desde la disponibilidad semanal del operario
  get fullDayContent(): { from: string; to: string } {
    const slots = this.operator?.availability ?? [];
    if (slots.length === 0) return { from: '--:--', to: '--:--' };
    const starts = slots.map(s => s.startTime).sort();
    const ends = slots.map(s => s.endTime).sort();
    return { from: starts[0], to: ends[ends.length - 1] };
  }

  dayLabel(index: number): string {
    return this.translate.instant('ADMIN_SCHEDULE.DAYS.' + DAY_KEYS[index]);
  }

  dayDateLabel(index: number): string {
    return this.fmt(this.dateOfDay(index));
  }

  /* ---------- lo que pasa en cada fecha ---------- */

  /** ausencia (si la hay) o turnos de ese día de la semana */
  private entriesFor(date: Date): DayEntry[] {
    if (!this.operator) return [];
    const iso = isoDay(date);
    const absence = this.operator.absences.find(a => a.startDate <= iso && iso <= a.endDate);
    if (absence) {
      return [{ type: 'leave', label: absence.reason || this.translate.instant('OPERATOR_CALENDAR.LEGEND.LEAVE') }];
    }
    const weekday = this.weekdayOf(date);
    return this.operator.availability
      .filter(s => s.day === weekday)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(s => ({
        type: 'available',
        startTime: s.startTime,
        endTime: s.endTime,
        label: this.translate.instant('OPERATOR_CALENDAR.LEGEND.AVAILABLE'),
      }));
  }

  entriesForDay(dayIndex: number): DayEntry[] {
    return this.entriesFor(this.dateOfDay(dayIndex));
  }

  /* ---------- vista mes ---------- */

  get monthLabel(): string {
    return this.monthViewDate.toLocaleDateString(this.locale, { month: 'long', year: 'numeric' });
  }

  get monthCells(): MonthCell[] {
    const year = this.monthViewDate.getFullYear();
    const month = this.monthViewDate.getMonth();
    const firstWeekday = this.weekdayOf(new Date(year, month, 1));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayIso();

    const cells: MonthCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ iso: null, day: null, isToday: false, isPast: false, kind: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = isoDay(date);
      const entries = this.entriesFor(date);
      cells.push({
        iso,
        day,
        isToday: iso === today,
        isPast: iso < today,
        kind: entries.length === 0 ? 'off' : entries[0].type,
      });
    }
    // completa la última fila para que la grilla quede pareja
    while (cells.length % 7 !== 0) {
      cells.push({ iso: null, day: null, isToday: false, isPast: false, kind: null });
    }
    return cells;
  }

  /* ---------- navegación ---------- */

  shiftWeek(delta: number): void {
    this.weekOffset += delta;
  }

  shiftMonth(delta: number): void {
    this.monthViewDate = new Date(this.monthViewDate.getFullYear(), this.monthViewDate.getMonth() + delta, 1);
  }

  // "Hoy" vuelve a la semana, el día y el mes actuales en cualquier vista
  goToToday(): void {
    this.weekOffset = 0;
    this.selectedDayIndex = this.weekdayOf(new Date());
    this.monthViewDate = this.firstOfMonth(new Date());
  }

  setView(view: CalendarView): void {
    this.view = view;
  }

  goBack(): void {
    if (!this.operator) return;
    this.router.navigate(['/admin/operators', this.operator.id]);
  }

  goToOperatorsList(): void {
    this.router.navigateByUrl('/admin/operators');
  }
}
