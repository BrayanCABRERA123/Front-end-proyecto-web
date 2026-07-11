import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-qualification-stats',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './qualification-stats.html',
  styleUrl: './qualification-stats.scss'
})
export class QualificationStatsComponent {

  // recibe los datos del padre
  @Input() calificacionPromedio: number = 0;
  @Input() nivelSatisfaccion: string = '';
  @Input() porcentajeSatisfaccion: number = 0;
  @Input() totalCalificaciones: number = 0;

  // genera arreglo de estrellas para mostrar
  get estrellas(): number[] {
    return Array(5).fill(0).map((_, i) =>
      i < Math.floor(this.calificacionPromedio) ? 1 : 0
    );
  }
}