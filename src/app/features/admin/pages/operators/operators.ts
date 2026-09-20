import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { Operator, OperatorsStore, OperatorStatus } from '../../services/operators-store';

type StatusFilter = 'all' | OperatorStatus;

@Component({
  selector: 'app-admin-operators',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent],
  templateUrl: './operators.html',
  styleUrl: './operators.scss'
})
export class OperatorsComponent {

  search = '';
  statusFilter: StatusFilter = 'all';

  constructor(
    private router: Router,
    private store: OperatorsStore
  ) {}

  get operators(): Operator[] {
    return this.store.operators;
  }

  get filteredOperators(): Operator[] {
    const term = this.search.trim().toLowerCase();

    return this.operators
      .filter(o => this.statusFilter === 'all' || o.status === this.statusFilter)
      .filter(o => !term
        || o.name.toLowerCase().includes(term)
        || o.specialty.toLowerCase().includes(term));
  }

  countByStatus(status: OperatorStatus): number {
    return this.operators.filter(o => o.status === status).length;
  }

  get weeklyServicesTotal(): number {
    return this.operators.reduce((sum, o) => sum + o.weeklyServices, 0);
  }

  get averageRating(): string {
    const total = this.operators.reduce((sum, o) => sum + o.rating, 0);
    return (total / this.operators.length).toFixed(1);
  }

  get totalReviews(): number {
    return this.operators.reduce((sum, o) => sum + o.reviewsCount, 0);
  }

  goToDetail(operator: Operator): void {
    this.router.navigate(['/admin/operators', operator.id]);
  }
}
