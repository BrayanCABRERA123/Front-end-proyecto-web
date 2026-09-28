import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { CalendarBlock, Operator, OperatorsStore } from '../../services/operators-store';

type CalendarView = 'week' | 'day' | 'month';

// lunes = 0 ... domingo = 6 (coincide con los bloques del modelo)
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export interface MonthCell {
  day: number | null;
  weekday: number; // 0 = lunes
  hasBlocks: boolean;
  blockCount: number;
}

@Component({
  selector: 'app-operator-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './operator-calendar.html',
  styleUrl: './operator-calendar.scss'
})
export class OperatorCalendarComponent implements OnInit {

  operator: Operator | undefined;
  view: CalendarView = 'week';

  // días laborales en la grilla semanal (lunes a sábado, igual que el mockup)
  dayIndexes = [0, 1, 2, 3, 4, 5];

  // semana visible: 0 = la actual, +1 la siguiente, -1 la anterior...
  weekOffset = 0;

  // dïa visible en la vista "Día" (lunes = 0 ... sábado = 5)
  selectedDayIndex = 0;

  // mes visible en la vista "Mes" (por defecto el mes actual)
  monthViewDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: OperatorsStore,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // reactivo: al navegar entre fichas cambia el id sin recargar
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.operator = this.store.getById(id);

      // el día seleccionado arranca en el día de hoy (si cae en semana laboral)
      this.selectedDayIndex = Math.min(5, (new Date().getDay() + 6) % 7);
    });
  }

  /* ---------- navegación de la semana ---------- */

  shiftWeek(delta: number): void {
    this.weekOffset += delta;
  }

  goToCurrentWeek(): void {
    this.weekOffset = 0;
  }

  /** lunes (ISO) de la semana visible */
  private get mondayOfVisibleWeek(): Date {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    monday.setDate(monday.getDate() + this.weekOffset * 7);
    return monday;
  }

  dateOfDay(dayIndex: number): Date {
    const d = new Date(this.mondayOfVisibleWeek);
    d.setDate(d.getDate() + dayIndex);
    return d;
  }

  private fmt(date: Date, withYear = false): string {
    const opts: Intl.DateTimeFormatOptions = withYear
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', opts);
  }

  get weekLabelContent(): { week: number; from: string; to: string } {
    const monday = this.mondayOfVisibleWeek;
    // número de semana ISO (lunes)
    const temp = new Date(monday);
    temp.setDate(temp.getDate() + 3);
    const week = Math.ceil(((temp.getTime() - new Date(temp.getFullYear(), 0, 4).getTime()) / 86400000 + 1) / 7);

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

  blocksForDay(index: number): CalendarBlock[] {
    if (!this.operator) return [];
    return this.operator.calendarBlocks
      .filter(b => b.day === index)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  /* ---------- vista mes ---------- */

  get monthLabel(): string {
    // sigue el idioma activo de la app (es/en/fr/pt)
    return this.monthViewDate.toLocaleDateString(this.translate.currentLang ?? 'es', { month: 'long', year: 'numeric' });
  }

  get monthCells(): MonthCell[] {
    const year = this.monthViewDate.getFullYear();
    const month = this.monthViewDate.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: MonthCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ day: null, weekday: i, hasBlocks: false, blockCount: 0 });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = (firstWeekday + day - 1) % 7;
      const blocks = this.blocksForDay(weekday);
      cells.push({ day, weekday, hasBlocks: blocks.length > 0, blockCount: blocks.length });
    }
    return cells;
  }

  blocksForWeekday(weekday: number): CalendarBlock[] {
    return this.blocksForDay(weekday);
  }

  /* ---------- navegación de la vista mes ---------- */

  shiftMonth(delta: number): void {
    this.monthViewDate = new Date(
      this.monthViewDate.getFullYear(),
      this.monthViewDate.getMonth() + delta,
      1
    );
  }

  goToCurrentMonth(): void {
    this.monthViewDate = new Date();
  }

  /* ---------- acciones ---------- */

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