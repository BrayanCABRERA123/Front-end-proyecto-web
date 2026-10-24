import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { AvailabilitySlot, TodayService } from '../../models/admin.models';
import { OperatorAbsenceModal, AbsenceModalResult } from './components/operator-absence-modal/operator-absence-modal';
import { OperatorProfileModal, OperatorProfileModalData, OperatorProfileModalResult } from './components/operator-profile-modal/operator-profile-modal';
import { AvailabilityModal, AvailabilityModalData } from './components/availability-modal/availability-modal';
import { OperatorDetailViewModel } from '../../viewmodels/operator-detail.viewmodel';
import { keepFresh } from '../../../../core/services/live-refresh';

// vista de la ficha del operario: los datos y las acciones están en OperatorDetailViewModel
@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  providers: [OperatorDetailViewModel],
  templateUrl: './operator-detail.html',
  styleUrl: './operator-detail.scss'
})
export class OperatorDetailComponent implements OnInit {

  readonly vm = inject(OperatorDetailViewModel);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly feedback = inject(FeedbackService);

  // datos frescos sin recargar (WEB-16): al entrar, al volver a la pestaña y con cada notificación nueva
  constructor() {
    keepFresh(silent => this.vm.load(silent));
  }

  ngOnInit(): void {
    // reactivo: al navegar de una ficha a otra cambia el id sin recargar la página
    this.route.paramMap.subscribe(params => this.vm.select(params.get('id') ?? ''));
  }

  // formatea a pesos colombianos, ej: $1.420.000
  cop(amount: number): string {
    return '$' + amount.toLocaleString('es-CO');
  }

  goBack(): void {
    this.router.navigateByUrl('/admin/operators');
  }

  goToCalendar(): void {
    const operator = this.vm.operator;
    if (operator) this.router.navigate(['/admin/operators', operator.id, 'calendar']);
  }

  /* ---------- acciones ---------- */

  registerAbsence(): void {
    const operator = this.vm.operator;
    if (!operator) return;
    this.dialog.open(OperatorAbsenceModal, { panelClass: 'custom-dialog' })
      .afterClosed()
      .subscribe((result: AbsenceModalResult | null) => {
        if (result) this.vm.addAbsence(operator, result);
      });
  }

  editProfile(): void {
    const operator = this.vm.operator;
    if (!operator) return;
    const data: OperatorProfileModalData = {
      name: operator.name,
      specialty: operator.specialty,
      skills: this.vm.skillsOf(operator),
    };
    this.dialog.open(OperatorProfileModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((result: OperatorProfileModalResult | null | undefined) => {
        if (result) this.vm.saveProfile(operator, result);
      });
  }

  editAvailability(): void {
    const operator = this.vm.operator;
    if (!operator) return;
    const data: AvailabilityModalData = { slots: operator.availability };
    this.dialog.open(AvailabilityModal, { panelClass: 'custom-dialog', data })
      .afterClosed()
      .subscribe((slots: AvailabilitySlot[] | null) => {
        if (slots) this.vm.saveAvailability(operator, slots);
      });
  }

  // el "Detalles / Bitácora / Ver orden" del historial abre la orden del servicio
  viewService(service: TodayService): void {
    this.feedback.info(
      'OPERATOR_DETAIL.SERVICE_DETAIL_TITLE',
      'OPERATOR_DETAIL.SERVICE_DETAIL_MESSAGE',
      {
        messageParams: { code: service.code },
        details: [
          { label: 'OPERATOR_DETAIL.SERVICE_DETAIL.VEHICLE', value: service.vehicle },
          { label: 'OPERATOR_DETAIL.SERVICE_DETAIL.SERVICE', value: service.service },
          { label: 'OPERATOR_DETAIL.SERVICE_DETAIL.BAY', value: service.bay },
          { label: 'OPERATOR_DETAIL.SERVICE_DETAIL.TIME', value: service.time },
        ],
      }
    );
  }

  exportSheet(): void {
    const o = this.vm.operator;
    if (!o) return;

    const columns: ExportColumn[] = [
      { key: 'name', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.NAME' },
      { key: 'specialty', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.SPECIALTY' },
      { key: 'phone', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.PHONE' },
      { key: 'email', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.EMAIL' },
      { key: 'id', labelKey: 'OPERATOR_DETAIL.ID_LABEL' },
      { key: 'bay', labelKey: 'OPERATOR_DETAIL.ASSIGNED_BAY' },
      { key: 'rating', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.RATING' },
      { key: 'reviews', labelKey: 'OPERATOR_DETAIL.EXPORT_FIELDS.REVIEWS' },
    ];

    const data: ExportDataModalData = {
      titleKey: 'OPERATOR_DETAIL.BAY_RULE.EXPORT',
      fileName: `ficha-tecnica-${o.id}`,
      documentTitle: `Ficha técnica — ${o.name}`,
      columns,
      rows: [{
        name: o.name,
        specialty: o.specialty,
        phone: o.phone,
        email: o.email,
        id: o.id,
        bay: o.bay ?? '—',
        rating: `${o.rating} / 5.0`,
        reviews: o.reviewsCount,
      }],
    };

    this.dialog.open(ExportDataModal, { panelClass: 'custom-dialog', data });
  }
}
