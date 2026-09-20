import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { Operator, OperatorsStore } from '../../services/operators-store';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './operator-detail.html',
  styleUrl: './operator-detail.scss'
})
export class OperatorDetailComponent {

  operator: Operator | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: OperatorsStore
  ) {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.operator = this.store.getById(id);
  }

  // porcentaje de horas ocupadas, para la barra de progreso
  get hoursUsedPercent(): number {
    if (!this.operator || this.operator.totalHours === 0) return 0;
    return Math.round((this.operator.availableHours / this.operator.totalHours) * 100);
  }

  // formatea a pesos colombianos, ej: $1.420.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  goBack(): void {
    this.router.navigateByUrl('/admin/operators');
  }

  goToCalendar(): void {
    if (!this.operator) return;
    this.router.navigate(['/admin/operators', this.operator.id, 'calendar']);
  }
}
