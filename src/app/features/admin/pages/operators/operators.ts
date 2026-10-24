import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { Operator } from '../../services/operators-store';
import { OperatorsViewModel } from '../../viewmodels/operators.viewmodel';
import { keepFresh } from '../../../../core/services/live-refresh';

// vista de Operarios: la lista y los filtros están en OperatorsViewModel
@Component({
  selector: 'app-admin-operators',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  providers: [OperatorsViewModel],
  templateUrl: './operators.html',
  styleUrl: './operators.scss'
})
export class OperatorsComponent {

  readonly vm = inject(OperatorsViewModel);
  private readonly router = inject(Router);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña y con cada notificación nueva
  constructor() {
    keepFresh(silent => this.vm.load(silent));
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