import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export type EmptyStateVariant = 'empty' | 'filtered' | 'loading' | 'error';

/**
 * Estado de interfaz reutilizable para tablas, listas y tarjetas.
 *
 * Cubre los cuatro casos que se repiten en el proyecto: pantalla sin datos,
 * búsqueda/filtro sin coincidencias, carga en curso y error al pedir los datos.
 * Se puede proyectar una acción (botón "Limpiar filtros", "Reintentar", etc.)
 * con content projection para no duplicar markup en cada pantalla.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyStateComponent {

  @Input() variant: EmptyStateVariant = 'empty';

  // ícono de Material; por defecto cambia según el tipo de estado
  @Input() icon = '';

  // llaves de traducción del título y la descripción
  @Input() titleKey = '';
  @Input() messageKey = '';

  // valores para interpolar en el mensaje (ej. {{ term: 'Carlos' }})
  @Input() params: Record<string, string | number> = {};

  // el estado de carga no necesita texto porque el skeleton ya informa
  @Input() showMessage = true;

  get resolvedIcon(): string {
    if (this.icon) return this.icon;

    switch (this.variant) {
      case 'filtered': return 'search_off';
      case 'loading': return 'hourglass_top';
      case 'error': return 'cloud_off';
      default: return 'inbox';
    }
  }
}
