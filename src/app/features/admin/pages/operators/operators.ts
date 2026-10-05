import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { ScheduleStore } from '../../services/schedule-store';
import { Operator, OperatorStatus, OperatorsStore } from '../../services/operators-store';
import { OperatorModal, OperatorModalData, OperatorModalResult } from './components/operator-modal/operator-modal';
import { AssignShiftModal, AssignShiftModalData, AssignShiftResult } from './components/assign-shift-modal/assign-shift-modal';

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
    private schedule: ScheduleStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
  ) {}

  get operators(): Operator[] {
    return this.store.operators();
  }

  // bahías activas para poder asignar un operario nuevo o un turno
  private get activeBays(): { id: string; name: string }[] {
    return this.schedule.bays()
      .filter(b => b.status === 'active')
      .map(b => ({ id: b.id, name: b.name }));
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
    if (this.operators.length === 0) return '0.0';
    const total = this.operators.reduce((sum, o) => sum + o.rating, 0);
    return (total / this.operators.length).toFixed(1);
  }

  get totalReviews(): number {
    return this.operators.reduce((sum, o) => sum + o.reviewsCount, 0);
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

  /* ---------- asignar turnos ---------- */

  openAssignShifts(): void {
    const data: AssignShiftModalData = {
      operators: this.operators.map(o => ({ id: o.id, name: o.name, initials: o.initials, status: o.status })),
      bays: this.activeBays,
    };

    const dialogRef = this.dialog.open(AssignShiftModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: AssignShiftResult | null) => {
      if (!result) return;

      this.store.setStatus(result.operatorId, result.status);
      // los operarios ya no quedan atados a una bahía (ADR-010): la bahía se elige por reserva

      const operator = this.store.getById(result.operatorId);
      this.feedback.success(
        'ADMIN_OPERATORS.FEEDBACK.SHIFT_TITLE',
        'ADMIN_OPERATORS.FEEDBACK.SHIFT_MESSAGE',
        { messageParams: { name: operator?.name ?? '' } }
      );
    });
  }
}