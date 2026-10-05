import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';
import { ExportColumn, ExportDataModal, ExportDataModalData } from '../../../../shared/dialogs/export-data-modal/export-data-modal';
import { FeedbackService } from '../../../../shared/dialogs/feedback.service';
import { OperatorsStore } from '../../services/operators-store';
import { ScheduleStore } from '../../services/schedule-store';
// reservas del día con su operario asignado (booking + operations)
import { ReservationsStore, formatTimeRange } from '../../services/reservations-store';
import { Operator, TodayService } from '../../models/admin.models';
import { OperatorAbsenceModal, AbsenceModalResult } from './components/operator-absence-modal/operator-absence-modal';
import { AvailabilityModal, AvailabilityModalData } from './components/availability-modal/availability-modal';
import { AssignShiftModal, AssignShiftModalData, AssignShiftResult } from '../operators/components/assign-shift-modal/assign-shift-modal';

@Component({
  selector: 'app-operator-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslateModule, SidebarComponent, EmptyStateComponent],
  templateUrl: './operator-detail.html',
  styleUrl: './operator-detail.scss'
})
export class OperatorDetailComponent implements OnInit {

  operator: Operator | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: OperatorsStore,
    private schedule: ScheduleStore,
    private dialog: MatDialog,
    private feedback: FeedbackService,
    private reservations: ReservationsStore,
  ) {}

  // servicios de hoy asignados a este operario
  get todayServices(): TodayService[] {
    if (!this.operator) return [];
    const id = this.operator.id;
    return this.reservations.byDate(this.reservations.today)
      .filter(b => b.operator?.id === id && b.status !== 'cancelled' && b.status !== 'no_show')
      .map((b): TodayService => ({
        code: b.code,
        vehicle: [b.vehicle, b.plate].filter(Boolean).join(' · '),
        service: b.service,
        bay: b.bay ?? '—',
        time: formatTimeRange(b.time, b.durationMin),
        status: b.status === 'completed' ? 'completed' : b.status === 'in_progress' ? 'in_progress' : 'scheduled'
      }));
  }

  ngOnInit(): void {
    // reactivo: al navegar de una ficha a otra cambia el id sin recargar la página
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') ?? '';
      this.operator = this.store.getById(id);
    });
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

  /* ---------- acciones ---------- */

  registerAbsence(): void {
    if (!this.operator) return;

    const dialogRef = this.dialog.open(OperatorAbsenceModal, { panelClass: 'custom-dialog' });

    dialogRef.afterClosed().subscribe((result: AbsenceModalResult | null) => {
      if (!result) return;
      this.store.addAbsence(this.operator!.id, result);

      // una ausencia registrada pone al operario en permiso médico
      this.store.setStatus(this.operator!.id, 'medical_leave');

      this.feedback.success(
        'OPERATOR_DETAIL.FEEDBACK.ABSENCE_TITLE',
        'OPERATOR_DETAIL.FEEDBACK.ABSENCE_MESSAGE',
        { messageParams: { name: this.operator!.name } }
      );
    });
  }

  editAvailability(): void {
    if (!this.operator) return;

    const data: AvailabilityModalData = { slots: this.operator.availability };

    const dialogRef = this.dialog.open(AvailabilityModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((slots: import('../../models/admin.models').AvailabilitySlot[] | null) => {
      if (!slots) return;
      this.store.setAvailability(this.operator!.id, slots);
      this.feedback.success(
        'OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_TITLE',
        'OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_MESSAGE',
        { messageParams: { name: this.operator!.name } }
      );
    });
  }

  assignBayShift(): void {
    if (!this.operator) return;

    const data: AssignShiftModalData = {
      operators: [{
        id: this.operator.id,
        name: this.operator.name,
        initials: this.operator.initials,
        status: this.operator.status,
      }],
      bays: this.schedule.bays()
        .filter(b => b.status === 'active')
        .map(b => ({ id: b.id, name: b.name })),
    };

    const dialogRef = this.dialog.open(AssignShiftModal, { panelClass: 'custom-dialog', data });

    dialogRef.afterClosed().subscribe((result: AssignShiftResult | null) => {
      if (!result) return;

      this.store.setStatus(result.operatorId, result.status);
      // los operarios ya no quedan atados a una bahía (ADR-010): la bahía se elige por reserva

      this.feedback.success(
        'OPERATOR_DETAIL.FEEDBACK.SHIFT_TITLE',
        'OPERATOR_DETAIL.FEEDBACK.SHIFT_MESSAGE',
        { messageParams: { name: this.operator!.name } }
      );
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
    if (!this.operator) return;

    const o = this.operator;
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