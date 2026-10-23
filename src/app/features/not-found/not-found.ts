import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth';

/**
 * Página para una dirección que no existe. El botón lleva al inicio de cada rol (o a la página de
 * bienvenida sin sesión), en lugar de dejar una pantalla en blanco.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatIconModule, TranslateModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFoundComponent {
  private readonly auth = inject(AuthService);

  get home(): string {
    return this.auth.isAuthenticated() ? this.auth.homeRoute() : '/';
  }
}
