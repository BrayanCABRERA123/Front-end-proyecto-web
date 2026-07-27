import { Injectable, computed, signal } from '@angular/core';
import { Calificacion } from '../../models/calificacion.model';
import { OperatorService } from '../../services/operator';

@Injectable()
export class QualificationsViewModel {

  readonly calificaciones = signal<Calificacion[]>([]);

  readonly calificacionPromedio = signal(4.3);
  readonly nivelSatisfaccion = signal('Muy alto');
  readonly porcentajeSatisfaccion = signal(86);

  readonly totalCalificaciones = computed(() => this.calificaciones().length);

  constructor(private operatorService: OperatorService) {}

  cargar(): void {
    this.operatorService.getCalificaciones().subscribe(calificaciones => this.calificaciones.set(calificaciones));
  }
}
