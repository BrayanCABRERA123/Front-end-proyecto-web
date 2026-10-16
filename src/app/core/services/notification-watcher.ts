import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AuthService } from './auth';
import { NotificationsService } from './notifications';

// cada cuánto se pregunta por notificaciones nuevas mientras la pestaña está visible
const POLL_MS = 45_000;

/**
 * Vigila la bandeja mientras la web está abierta, para que el usuario (sobre todo el admin) se entere
 * sin recargar: cuenta las no leídas (contador del menú), y si llegan nuevas muestra un aviso flotante
 * y avisa a la página de notificaciones para que se recargue.
 *
 * Con la pestaña oculta no consulta (no gasta); al volver a ella consulta de una vez. Al iniciar
 * sesión solo toma la cuenta actual: los avisos son para lo que llegue después.
 */
@Injectable({ providedIn: 'root' })
export class NotificationWatcher {

  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  /** no leídas del usuario con sesión (0 sin sesión) */
  readonly unread = signal(0);
  /** llegaron notificaciones nuevas: la página de notificaciones se recarga */
  readonly arrived = new Subject<void>();

  private timer: ReturnType<typeof setInterval> | null = null;
  // la última cuenta conocida; null = todavía no se sabe (recién entró: no se avisa lo que ya había)
  private lastCount: number | null = null;
  private checking = false;

  /** Empieza a vigilar (se puede llamar varias veces: vigila una sola vez). */
  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => this.check(), POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.check();
  }

  /** Vuelve a contar ya (ej. después de marcar como leídas en la página de notificaciones). */
  refresh(): void {
    this.check(false);
  }

  private readonly onVisibility = () => {
    if (!document.hidden) this.check();
  };

  private check(announce = true): void {
    if (!this.auth.isAuthenticated()) {
      this.lastCount = null;
      this.unread.set(0);
      return;
    }
    if (document.hidden || this.checking) return;
    this.checking = true;
    this.notifications.unreadCount().subscribe({
      next: (count) => {
        this.checking = false;
        const previous = this.lastCount;
        this.lastCount = count;
        this.unread.set(count);
        if (announce && previous !== null && count > previous) {
          this.announce(count - previous);
          this.arrived.next();
        }
      },
      // sin red o con el servicio caído se reintenta en la siguiente vuelta
      error: () => {
        this.checking = false;
      }
    });
  }

  // aviso flotante: el título de la más reciente, o cuántas llegaron
  private announce(newCount: number): void {
    this.notifications.list().subscribe({
      next: (items) => {
        const newest = items.find(item => !item.read);
        const text = newCount === 1 && newest
          ? newest.title
          : this.translate.instant('NOTIFICATIONS.WATCHER.MANY', { count: newCount });
        this.snackBar.open(text, this.translate.instant('NOTIFICATIONS.WATCHER.VIEW'), {
          duration: 7000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: 'notification-toast'
        }).onAction().subscribe(() => void this.router.navigateByUrl(this.inboxRoute()));
      },
      error: () => undefined
    });
  }

  private inboxRoute(): string {
    const roles = this.auth.user()?.roles ?? [];
    const home = roles.includes('ADMIN') ? '/admin' : roles.includes('OPERATOR') ? '/operator' : '/client';
    return `${home}/notifications`;
  }
}
