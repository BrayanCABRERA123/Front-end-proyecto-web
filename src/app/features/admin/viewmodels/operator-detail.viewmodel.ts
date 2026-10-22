import { Injectable, inject, signal } from '@angular/core';

import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { OperatorsStore } from '../services/operators-store';
// reservas del día con su operario asignado (booking + operations)
import { ReservationsStore, formatTimeRange } from '../services/reservations-store';
import { AvailabilitySlot, Operator, TodayService } from '../models/admin.models';
import { OperationsApiService, OperatorMetricsResponse, OperatorSkillLevel } from '../../../core/services/operations-api';
import { apiErrorKey } from '../../../core/utils/api-error';
import { AbsenceModalResult } from '../pages/operator-detail/components/operator-absence-modal/operator-absence-modal';
import { OperatorProfileModalResult } from '../pages/operator-detail/components/operator-profile-modal/operator-profile-modal';

/** Ficha de un operario: sus datos, métricas de la semana, servicios de hoy y sus acciones. */
@Injectable()
export class OperatorDetailViewModel {

  private readonly store = inject(OperatorsStore);
  private readonly reservations = inject(ReservationsStore);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly feedback = inject(FeedbackService);

  private operatorId = '';
  // métricas reales de la semana (operations-service); null mientras cargan o si fallan
  readonly metrics = signal<OperatorMetricsResponse | null>(null);

  // se lee del store cada vez: llega aunque la ficha se abra antes de que carguen los operarios y
  // refleja los cambios (activar, ausencias, disponibilidad) sin volver a buscarlo
  get operator(): Operator | undefined {
    return this.store.getById(this.operatorId);
  }

  get loading(): boolean {
    return !this.store.loaded();
  }

  // servicios de hoy asignados a este operario
  get todayServices(): TodayService[] {
    const operator = this.operator;
    if (!operator) return [];
    return this.reservations.byDate(this.reservations.today)
      .filter(b => b.operator?.id === operator.id && b.status !== 'cancelled' && b.status !== 'no_show')
      .map((b): TodayService => ({
        code: b.code,
        vehicle: [b.vehicle, b.plate].filter(Boolean).join(' · '),
        service: b.service,
        bay: b.bay ?? '—',
        time: formatTimeRange(b.time, b.durationMin),
        status: b.status === 'completed' ? 'completed' : b.status === 'in_progress' ? 'in_progress' : 'scheduled'
      }));
  }

  // al navegar de una ficha a otra cambia el id sin recargar la página
  select(id: string): void {
    this.operatorId = id;
    this.metrics.set(null);
    if (!id) return;
    this.operationsApi.operatorMetrics(Number(id)).subscribe({
      next: metrics => this.metrics.set(metrics),
      error: () => undefined
    });
  }

  // la incapacidad sale de las ausencias: al recargar, el operario aparece incapacitado
  addAbsence(operator: Operator, absence: AbsenceModalResult): void {
    this.store.addAbsence(operator.id, absence).subscribe({
      next: () => this.feedback.success('OPERATOR_DETAIL.FEEDBACK.ABSENCE_TITLE', 'OPERATOR_DETAIL.FEEDBACK.ABSENCE_MESSAGE',
        { messageParams: { name: operator.name } }),
      error: (error: unknown) => this.feedback.error('OPERATOR_DETAIL.FEEDBACK.ABSENCE_ERROR_TITLE', apiErrorKey(error))
    });
  }

  saveAvailability(operator: Operator, slots: AvailabilitySlot[]): void {
    this.store.setAvailability(operator.id, slots).subscribe({
      next: () => this.feedback.success('OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_TITLE', 'OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_MESSAGE',
        { messageParams: { name: operator.name } }),
      error: (error: unknown) => this.feedback.error('OPERATOR_DETAIL.FEEDBACK.AVAILABILITY_ERROR_TITLE', apiErrorKey(error))
    });
  }

  // especialidad y habilidades (operations-service): guardar reemplaza la lista completa
  saveProfile(operator: Operator, result: OperatorProfileModalResult): void {
    this.store.saveProfile(operator.id, result.specialty, result.skills).subscribe({
      next: () => this.feedback.success('OPERATOR_PROFILE_MODAL.SAVED_TITLE', 'OPERATOR_PROFILE_MODAL.SAVED_MESSAGE',
        { messageParams: { name: operator.name } }),
      error: (error: unknown) => this.feedback.error('OPERATOR_PROFILE_MODAL.SAVE_ERROR_TITLE', apiErrorKey(error))
    });
  }

  // habilidades del operario como las pide el modal del perfil
  skillsOf(operator: Operator): { name: string; level: OperatorSkillLevel }[] {
    return operator.certifications.map(c => ({ name: c.name, level: c.level as OperatorSkillLevel }));
  }
}
