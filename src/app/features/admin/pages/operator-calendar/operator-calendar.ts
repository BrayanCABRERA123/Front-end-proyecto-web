import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { OperatorCalendarViewModel } from '../../viewmodels/operator-calendar.viewmodel';

// vista del calendario del operario: fechas, vistas y disponibilidad están en OperatorCalendarViewModel
@Component({
  selector: 'app-operator-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  providers: [OperatorCalendarViewModel],
  templateUrl: './operator-calendar.html',
  styleUrl: './operator-calendar.scss'
})
export class OperatorCalendarComponent implements OnInit {

  readonly vm = inject(OperatorCalendarViewModel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // reactivo: al navegar entre fichas cambia el id sin recargar
    this.route.paramMap.subscribe(params => this.vm.select(params.get('id') ?? ''));
  }

  goBack(): void {
    const operator = this.vm.operator;
    if (operator) this.router.navigate(['/admin/operators', operator.id]);
  }

  goToOperatorsList(): void {
    this.router.navigateByUrl('/admin/operators');
  }
}
