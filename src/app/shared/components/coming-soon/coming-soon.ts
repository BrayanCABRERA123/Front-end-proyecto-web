import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// placeholder reutilizable para pantallas que ya tienen ruta/sidebar
// pero cuyo contenido final todavía estamos construyendo pantalla por pantalla
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss'
})
export class ComingSoonComponent {

  // ícono de material que mejor represente la sección (ej: 'event_available' para Reservas)
  @Input() icon = 'construction';

  // título de la página (ej: 'Reservas'), se usa arriba del mensaje
  @Input() pageTitle = '';

  // bajada corta debajo del título (ej: 'Monitorea, asigna operarios...')
  @Input() pageSubtitle = '';
}
