import { Injectable, inject } from '@angular/core';

import { Operator, OperatorStatus, OperatorsStore } from '../services/operators-store';
import { TeamSummaryResponse } from '../../../core/services/operations-api';

export type OperatorStatusFilter = 'all' | OperatorStatus;

/** Lista de operarios del admin con búsqueda, filtro por estado y el resumen del equipo. */
@Injectable()
export class OperatorsViewModel {

  private readonly store = inject(OperatorsStore);

  search = '';
  statusFilter: OperatorStatusFilter = 'all';

  get operators(): Operator[] {
    return this.store.operators();
  }

  get filteredOperators(): Operator[] {
    const term = this.search.trim().toLowerCase();
    return this.operators
      .filter(o => this.statusFilter === 'all' || o.status === this.statusFilter)
      .filter(o => !term || o.name.toLowerCase().includes(term) || o.specialty.toLowerCase().includes(term));
  }

  countByStatus(status: OperatorStatus): number {
    return this.operators.filter(o => o.status === status).length;
  }

  // resumen del equipo (operations-service); null mientras carga o si falla
  get summary(): TeamSummaryResponse | null {
    return this.store.summary();
  }
}
