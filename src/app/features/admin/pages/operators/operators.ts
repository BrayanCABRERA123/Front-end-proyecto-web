import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { Operator, OperatorStatus, OperatorsStore } from '../../services/operators-store';
import { TeamSummaryResponse } from '../../../../core/services/operations-api';
import { OperatorModal, OperatorModalData, OperatorModalResult } from './components/operator-modal/operator-modal';

type StatusFilter = 'all' | OperatorStatus;

@Component({
  selector: 'app-admin-operators',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './operators.html',
  styleUrl: './operators.scss'
})
export class OperatorsComponent {

  search = '';
  statusFilter: StatusFilter = 'all';

  constructor(
    private router: Router,
    private store: OperatorsStore,
  ) {}

  get operators(): Operator[] {
    return this.store.operators();
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

  // resumen del equipo (operations-service); null mientras carga o si falla
  get summary(): TeamSummaryResponse | null {
    return this.store.summary();
  }

  goToDetail(operator: Operator): void {
    this.router.navigate(['/admin/operators', operator.id]);
  }

  /* ---------- nuevo operario ---------- */

  // un operario es una cuenta con rol Operario: se crea y se edita en Gestión → Usuarios
  // (security-service) y aparece aquí solo (operations-service la toma)
  openCreate(): void {
    this.router.navigate(['/admin/management']);
  }

  openEdit(_operator: Operator): void {
    this.router.navigate(['/admin/management']);
  }
}