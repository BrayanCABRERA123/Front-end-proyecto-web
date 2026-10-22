import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// iniciar y finalizar los valida operations-service (que sea suyo, la hora, que no tenga otro en curso)
import { OperationsApiService } from '../../../core/services/operations-api';
import { apiErrorKey } from '../../../core/utils/api-error';
import { FeedbackService } from '../../../shared/dialogs/feedback.service';

/**
 * Iniciar y finalizar un servicio, igual en Inicio, Mi Agenda y Servicios asignados. Avisa el
 * resultado solo cuando el servidor responde y después llama a `done` para que la pantalla
 * recargue su lista (también si falló: así muestra el estado real).
 */
@Injectable()
export class OperatorWorkViewModel {

  private readonly operations = inject(OperationsApiService);
  private readonly feedback = inject(FeedbackService);

  start(bookingId: number, code: string, done: () => void): void {
    this.advance(this.operations.start(bookingId), done, () => this.feedback.success(
      'ASSIGNED_SERVICES.DETAIL.STARTED_TITLE', 'ASSIGNED_SERVICES.DETAIL.STARTED_MESSAGE', { messageParams: { code } }));
  }

  finish(bookingId: number, code: string, done: () => void): void {
    this.advance(this.operations.finish(bookingId), done, () => this.feedback.success(
      'ASSIGNED_SERVICES.DETAIL.FINISHED_TITLE', 'ASSIGNED_SERVICES.DETAIL.FINISHED_MESSAGE', { messageParams: { code } }));
  }

  // el backend no deja (ej. aún no es la hora o ya la cerró el admin): se dice por qué
  private advance(call: Observable<unknown>, done: () => void, announce: () => void): void {
    call.subscribe({
      next: () => {
        done();
        announce();
      },
      error: (error: unknown) => {
        this.feedback.error('COMMON.ERROR', apiErrorKey(error));
        done();
      }
    });
  }
}
