import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// una celda del calendario
interface CalendarDay {
  date: string;         // 'AAAA-MM-DD'
  number: number;       // dia del mes (1-31)
  inCurrentMonth: boolean; // false = dia "relleno" de otro mes
  serviceCount: number;
  isToday: boolean;
}

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './mini-calendar.html',
  styleUrl: './mini-calendar.scss'
})
export class MiniCalendarComponent implements OnChanges {

  // mapa 'AAAA-MM-DD' -> cuantos servicios hay ese dia
  @Input() servicesByDate: Record<string, number> = {};
  @Input() selectedDate: string = '';

  @Output() selectedDateChange = new EventEmitter<string>();

  // mes que se esta mostrando actualmente (siempre el dia 1 de ese mes)
  shownMonth = new Date();

  weeks: CalendarDay[][] = [];

  constructor(private translate: TranslateService) {}

  // nombre del mes mostrado, ej: 'Septiembre 2026'
  get monthTitle(): string {
    const months: string[] = this.translate.instant('CALENDAR.MONTHS');
    const name = months[this.shownMonth.getMonth()];
    return `${name} ${this.shownMonth.getFullYear()}`;
  }

  // encabezados de columna: Lun, Mar, Mie...
  get shortWeekdays(): string[] {
    return this.translate.instant('CALENDAR.DAYS_SHORT');
  }

  // como el input llega despues de crear el componente, generamos
  // el calendario cada vez que algo relevante cambie
  ngOnChanges(changes: SimpleChanges): void {
    // OJO: 'servicesByDate' llega de un getter en el padre, que crea
    // un objeto nuevo en cada revision de Angular -> eso dispara ngOnChanges
    // todo el tiempo. Por eso solo reubicamos el mes cuando la fecha
    // seleccionada CAMBIO de verdad, para no pisar la navegacion manual
    // del usuario con los botones < >.
    if (changes['selectedDate'] && this.selectedDate) {
      const [year, month] = this.selectedDate.split('-').map(Number);
      this.shownMonth = new Date(year, month - 1, 1);
    }
    this.buildCalendar();
  }

  previousMonth() {
    this.shownMonth = new Date(this.shownMonth.getFullYear(), this.shownMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.shownMonth = new Date(this.shownMonth.getFullYear(), this.shownMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDay(day: CalendarDay) {
    if (!day.inCurrentMonth) return;
    this.selectedDateChange.emit(day.date);
  }

  // convierte una fecha real a texto 'AAAA-MM-DD' (sin usar toISOString,
  // que convierte a UTC y puede correr el dia segun la zona horaria)
  private toDateText(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildCalendar() {
    const year = this.shownMonth.getFullYear();
    const month = this.shownMonth.getMonth();

    const todayText = this.toDateText(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // getDay() da 0=domingo..6=sabado; convertimos a 0=lunes..6=domingo
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    // primer dia que se pinta en la grilla (puede ser del mes anterior)
    const gridStart = new Date(year, month, 1 - startOffset);

    const totalCells = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7;

    const cells: CalendarDay[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const dateText = this.toDateText(date);

      cells.push({
        date: dateText,
        number: date.getDate(),
        inCurrentMonth: date.getMonth() === month,
        serviceCount: this.servicesByDate[dateText] ?? 0,
        isToday: dateText === todayText
      });
    }

    // partimos el arreglo plano en semanas de 7
    this.weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.weeks.push(cells.slice(i, i + 7));
    }
  }

  // limitamos a maximo 3 puntitos para que no se amontonen visualmente
  dots(count: number): number[] {
    return Array(Math.min(count, 3)).fill(0);
  }
}
