import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QualificationsViewModel } from '../../viewmodels/qualifications.viewmodel';

// vista de Calificaciones: el estado y los filtros están en QualificationsViewModel
@Component({
  selector: 'app-qualifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    QualificationStatsComponent,
    QualificationCardComponent,
    MatIconModule,
    TranslateModule
  ],
  providers: [QualificationsViewModel],
  templateUrl: './qualifications.html',
  styleUrl: './qualifications.scss'
})
export class QualificationsComponent implements OnInit {

  readonly vm = inject(QualificationsViewModel);

  ngOnInit(): void {
    this.vm.load();
  }

  // arreglo de estrellas para pintar (1 = llena, 0 = vacía)
  getStars(count: number): number[] {
    return Array(5).fill(0).map((_, i) => i < count ? 1 : 0);
  }
}
