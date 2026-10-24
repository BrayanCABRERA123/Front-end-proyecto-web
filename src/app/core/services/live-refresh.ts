import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, filter, fromEvent, interval, map, merge, share } from 'rxjs';

import { NotificationWatcher } from './notification-watcher';

// entre dos recargas automáticas de la misma pantalla pasan al menos estos ms: al volver a la pestaña
// llegan "visibilitychange" y "focus" casi a la vez, y la bandeja puede avisar justo después
export const REFRESH_MIN_GAP_MS = 5_000;
// refresco liviano de las vistas que esperan a otra persona (pago, revisión, servicios asignados…)
export const WAITING_POLL_MS = 45_000;

export interface FreshOptions {
  // cada cuánto se vuelve a pedir mientras la pestaña esté visible (sin valor: solo con los avisos)
  pollMs?: number;
  // false cuando la pantalla ya hace su primera carga por su cuenta (por ejemplo, en ngOnInit)
  initial?: boolean;
}

/**
 * Datos frescos sin recargar la página (WEB-16): avisa cuándo conviene volver a pedir los datos de
 * una pantalla. Al volver a la pestaña o a la ventana, cuando la bandeja detecta una notificación
 * nueva y, en las vistas que esperan a otra persona, cada tanto mientras la pestaña esté visible.
 */
@Injectable({ providedIn: 'root' })
export class LiveRefresh {

  private readonly document = inject(DOCUMENT);
  private readonly watcher = inject(NotificationWatcher);

  /** la pestaña volvió a estar visible, la ventana recuperó el foco o llegó una notificación nueva */
  readonly wake$: Observable<void> = merge(
    fromEvent(this.document, 'visibilitychange'),
    fromEvent(this.document.defaultView ?? this.document, 'focus'),
    this.watcher.arrived
  ).pipe(map(() => undefined), share());

  isVisible(): boolean {
    return !this.document.hidden;
  }

  /**
   * Llama `load(false)` al entrar (salvo `initial: false`) y `load(true)` con cada aviso: el `true`
   * le dice a la pantalla que es un refresco automático (sin indicador de carga y sin mensajes si
   * falla). Nunca dos veces en menos de REFRESH_MIN_GAP_MS, ni con la pestaña oculta. Se detiene
   * cuando se destruye la pantalla dueña de `destroyRef`.
   */
  watch(load: (silent: boolean) => void, destroyRef: DestroyRef, options: FreshOptions = {}): void {
    let last = Date.now();
    if (options.initial !== false) load(false);
    const triggers$ = options.pollMs ? merge(this.wake$, interval(options.pollMs)) : this.wake$;
    triggers$
      .pipe(filter(() => this.isVisible() && Date.now() - last >= REFRESH_MIN_GAP_MS), takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        last = Date.now();
        load(true);
      });
  }
}

/**
 * Atajo para el constructor (o un campo) de una pantalla: carga al entrar y vuelve a cargar al volver
 * a la pestaña, al llegar una notificación y, con `pollMs`, cada tanto.
 */
export function keepFresh(load: (silent: boolean) => void, options: FreshOptions = {}): void {
  inject(LiveRefresh).watch(load, inject(DestroyRef), options);
}
