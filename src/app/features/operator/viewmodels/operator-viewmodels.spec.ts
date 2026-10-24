import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OperationsApiService, OperatorServiceResponse, RatingResponse } from '../../../core/services/operations-api';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';
import { OperatorWorkViewModel } from './operator-work.viewmodel';
import { OperatorHomeViewModel } from './home.viewmodel';
import { OperatorScheduleViewModel } from './schedule.viewmodel';
import { AssignedServicesViewModel } from './assigned-services.viewmodel';
import { ServiceHistoryViewModel } from './service-history.viewmodel';
import { QualificationsViewModel } from './qualifications.viewmodel';

function service(id: number, date: string, startTime: string, status: OperatorServiceResponse['status'], changes: Partial<OperatorServiceResponse> = {}): OperatorServiceResponse {
  return {
    bookingId: id, code: `RES-${id}`, bookingStatus: 'CONFIRMED', date, startTime, endTime: '23:59', services: 'Básico',
    vehicle: 'Mazda 3', plate: `AB${id}`, total: 20000, status, startedAt: null, finishedAt: null, rating: null,
    comment: null, startableAt: null, clientName: 'Ana', ...changes,
  };
}

const rating = (bookingId: number, value: number, services = 'Básico'): RatingResponse =>
  ({ bookingId, bookingCode: `RES-${bookingId}`, date: '2026-10-20', services, plate: 'ABC123', rating: value, comment: null, clientName: 'Ana' } as RatingResponse);

describe('ViewModels del operario', () => {
  const operations = { start: vi.fn(), finish: vi.fn(), myServices: vi.fn(), myRatings: vi.fn() };
  const feedback = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    Object.values(operations).forEach(f => f.mockReset());
    Object.values(feedback).forEach(f => f.mockReset());
    operations.myServices.mockReturnValue(of([]));
    operations.myRatings.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        { provide: OperationsApiService, useValue: operations },
        { provide: FeedbackService, useValue: feedback },
        OperatorWorkViewModel, OperatorHomeViewModel, OperatorScheduleViewModel, AssignedServicesViewModel,
        ServiceHistoryViewModel, QualificationsViewModel,
      ],
    });
  });

  describe('OperatorWorkViewModel', () => {
    it('avisa el inicio solo cuando el servidor lo guardó y recarga', () => {
      operations.start.mockReturnValue(of({}));
      const done = vi.fn();

      TestBed.inject(OperatorWorkViewModel).start(9, 'RES-9', done);

      expect(operations.start).toHaveBeenCalledWith(9);
      expect(done).toHaveBeenCalled();
      expect(feedback.success).toHaveBeenCalledWith('ASSIGNED_SERVICES.DETAIL.STARTED_TITLE',
        'ASSIGNED_SERVICES.DETAIL.STARTED_MESSAGE', { messageParams: { code: 'RES-9' } });
    });

    it('si el servidor rechaza finalizar dice por qué, no muestra éxito y recarga igual', () => {
      operations.finish.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'EXECUTION_ALREADY_STARTED' } })));
      const done = vi.fn();

      TestBed.inject(OperatorWorkViewModel).finish(9, 'RES-9', done);

      expect(feedback.success).not.toHaveBeenCalled();
      expect(feedback.error).toHaveBeenCalledWith('COMMON.ERROR', 'API_ERRORS.EXECUTION_ALREADY_STARTED');
      expect(done).toHaveBeenCalled();
    });
  });

  it('Inicio: cuenta pendientes, en curso y terminados de hoy', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-21', '08:00', 'PENDING'), service(2, '2026-10-21', '09:00', 'IN_PROGRESS'),
      service(3, '2026-10-21', '10:00', 'COMPLETED'), service(4, '2026-10-21', '11:00', 'PENDING'),
    ]));
    operations.myRatings.mockReturnValue(of([rating(1, 5), rating(2, 4)]));
    const vm = TestBed.inject(OperatorHomeViewModel);

    vm.load();

    expect([vm.totalToday(), vm.pending(), vm.inProgress(), vm.completedToday()]).toEqual([4, 2, 1, 1]);
    expect(vm.progressPercentage()).toBe(25);
    expect(vm.averageRating()).toBe(4.5);
  });

  it('Mi Agenda: muestra el día elegido y la semana de lunes a domingo', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-19', '08:00', 'COMPLETED'), service(2, '2026-10-21', '10:00', 'PENDING'),
      service(3, '2026-10-21', '08:00', 'PENDING'), service(4, '2026-10-26', '09:00', 'PENDING'),
    ]));
    const vm = TestBed.inject(OperatorScheduleViewModel);
    vm.load();

    vm.selectDate('2026-10-21');
    expect(vm.visibleList().map(r => r.id)).toEqual([3, 2]);
    expect(vm.pendingForDay()).toBe(2);

    vm.changeTab('week');
    expect(vm.visibleList().map(r => r.id)).toEqual([1, 3, 2]);

    vm.changeTab('completed');
    expect(vm.visibleList().map(r => r.id)).toEqual([1]);
    expect(vm.servicesByDate()['2026-10-21']).toBe(2);
  });

  it('Servicios asignados: filtra por placa o código e inicia el seleccionado', () => {
    operations.myServices.mockReturnValue(of([service(1, '2026-10-21', '08:00', 'PENDING'), service(2, '2026-10-21', '09:00', 'PENDING')]));
    operations.start.mockReturnValue(of({}));
    const vm = TestBed.inject(AssignedServicesViewModel);
    vm.load();

    expect(vm.selectedService()?.bookingId).toBe(1);
    vm.vehicleFilter.set('ab2');
    expect(vm.filteredServices().map(s => s.bookingId)).toEqual([2]);

    vm.select(vm.filteredServices()[0]);
    vm.advance('IN_PROGRESS');
    expect(operations.start).toHaveBeenCalledWith(2);
  });

  it('A-18: Servicios asignados usa los datos reales: tipos de servicio, filtro por tipo y total', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-21', '08:00', 'PENDING'), service(2, '2026-10-21', '09:00', 'PENDING', { services: 'Premium', total: 45000 })]));
    const vm = TestBed.inject(AssignedServicesViewModel);
    vm.load();

    expect(vm.serviceTypes().map(t => t.value)).toEqual(['', 'Básico', 'Premium']);
    vm.serviceTypeFilter.set('Premium');
    expect(vm.filteredServices().map(s => s.bookingId)).toEqual([2]);
    expect(vm.filteredServices()[0].total).toBe('$ 45.000');
  });

  it('A-18: el historial muestra el nombre del cliente, no la placa', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-20', '08:00', 'COMPLETED', { clientName: 'Lucía' }),
      service(2, '2026-10-19', '08:00', 'COMPLETED', { clientName: '' })]));
    const vm = TestBed.inject(ServiceHistoryViewModel);
    vm.load();

    expect(vm.services().map(s => s.client)).toEqual(['Lucía', '—']);
  });

  it('Historial: solo terminados, con tasa, total generado y filtros', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-20', '08:00', 'COMPLETED', { rating: 5 }), service(2, '2026-10-19', '08:00', 'COMPLETED', { rating: 3, services: 'Premium' }),
      service(3, '2026-10-21', '08:00', 'PENDING'),
    ]));
    const vm = TestBed.inject(ServiceHistoryViewModel);
    vm.load();

    expect(vm.services().map(s => s.id)).toEqual([1, 2]);
    expect(vm.totalGenerated()).toBe(40000);
    expect(vm.averageRating()).toBe(4);
    vm.serviceFilter.set('Premium');
    expect(vm.filteredServices().map(s => s.id)).toEqual([2]);
    vm.clearFilters();
    expect(vm.filteredServices().length).toBe(2);
  });

  it('A-18: el estado del historial sale de los datos (cancelada o no asistió = cancelado) y no suma ingresos', () => {
    operations.myServices.mockReturnValue(of([
      service(1, '2026-10-20', '08:00', 'COMPLETED'), service(2, '2026-10-19', '08:00', 'PENDING', { bookingStatus: 'CANCELLED' }),
      service(3, '2026-10-18', '08:00', 'PENDING', { bookingStatus: 'NO_SHOW' }), service(4, '2026-10-21', '08:00', 'PENDING'),
    ]));
    const vm = TestBed.inject(ServiceHistoryViewModel);
    vm.load();

    expect(vm.services().map(s => [s.id, s.status])).toEqual([[1, 'finalizado'], [2, 'cancelado'], [3, 'cancelado']]);
    expect(vm.totalGenerated()).toBe(20000);
    expect(vm.countTab('cancelado')).toBe(2);
  });

  it('Calificaciones: promedio, satisfacción y filtro por estrellas', () => {
    operations.myRatings.mockReturnValue(of([rating(1, 5), rating(2, 4), rating(3, 2)]));
    const vm = TestBed.inject(QualificationsViewModel);
    vm.load();

    expect(vm.averageRating()).toBe(3.7);
    expect(vm.satisfactionLevel()).toBe('67%');
    vm.starsFilter.set('4');
    expect(vm.filteredRatings().map(r => r.id)).toEqual([2]);
  });
});
