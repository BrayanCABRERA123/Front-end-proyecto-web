import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { CalendarBlock, Operator, OperatorsStore } from '../../services/operators-store';

type CalendarView = 'week' | 'day' | 'month';

@Component({
  selector: 'app-operator-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './operator-calendar.html',
  styleUrl: './operator-calendar.scss'
})
export class OperatorCalendarComponent {

  operator: Operator | undefined;
  view: CalendarView = 'week';

  // días laborales que mostramos en la grilla (lunes a sábado, igual que el mockup)
  dayIndexes = [0, 1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: OperatorsStore,
    private translate: TranslateService
  ) {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.operator = this.store.getById(id);
  }

  dayLabel(index: number): string {
    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return this.translate.instant('ADMIN_SCHEDULE.DAYS.' + keys[index]);
  }

  blocksForDay(index: number): CalendarBlock[] {
    if (!this.operator) return [];
    return this.operator.calendarBlocks
      .filter(b => b.day === index)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
