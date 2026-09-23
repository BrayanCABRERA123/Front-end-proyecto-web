import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// importamos el sidebar
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar';
// importamos los componentes hijos
import { QualificationStatsComponent } from './components/qualification-stats/qualification-stats';
import { QualificationCardComponent } from './components/qualification-card/qualification-card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { OperatorRating, OperatorWorkService } from '../../../../core/services/operator-work';


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
  templateUrl: './qualifications.html',
  styleUrl: './qualifications.scss'
})
export class QualificationsComponent implements OnInit {

  // filtros de búsqueda
  dateFilter: string = '';
  serviceTypeFilter: string = '';
  starsFilter: string = '';

  // opciones de los selects
  serviceTypes = [
  { value: '', label: 'QUALIFICATIONS.TYPE_ALL' },
  { value: 'BASIC',   label: 'QUALIFICATIONS.TYPE_BASIC' },
  { value: 'PREMIUM', label: 'QUALIFICATIONS.TYPE_PREMIUM' },
  { value: 'FULL',    label: 'QUALIFICATIONS.TYPE_FULL' }
];

starOptions = [
  { value: '', label: 'QUALIFICATIONS.STARS_ALL' },
  { value: '5', label: 'QUALIFICATIONS.STARS_5' },
  { value: '4', label: 'QUALIFICATIONS.STARS_4' },
  { value: '3', label: 'QUALIFICATIONS.STARS_3' },
  { value: '2', label: 'QUALIFICATIONS.STARS_2' },
  { value: '1', label: 'QUALIFICATIONS.STARS_1' }
];

  // estadísticas generales (calculadas por el mock sobre los últimos 12 meses)
  averageRating: number = 0;
  satisfactionLevel: string = ''; // clave i18n QUALIFICATION_STATS.LEVEL.*
  satisfactionPercentage: number = 0;
  totalRatings: number = 0;

  // calificaciones recibidas por el operario autenticado (GET /me/operator/ratings)
  ratings: OperatorRating[] = [];

  // filtros aplicados al pulsar el botón de filtrar
  private applied = { date: '', type: '', stars: '' };

  constructor(
    private operatorWork: OperatorWorkService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.operatorWork.ratings$().subscribe(({ stats, items }) => {
      this.averageRating = stats.averageRating;
      this.satisfactionLevel = stats.satisfactionLevel;
      this.satisfactionPercentage = stats.satisfactionPercentage;
      this.totalRatings = stats.totalRatings;
      this.ratings = items;
      this.cdr.markForCheck();
    });
  }

  applyFilters(): void {
    this.applied = { date: this.dateFilter, type: this.serviceTypeFilter, stars: this.starsFilter };
  }

  resetFilters(): void {
    this.dateFilter = '';
    this.serviceTypeFilter = '';
    this.starsFilter = '';
    this.applyFilters();
  }

  // filtra las calificaciones según los filtros aplicados
  get filteredRatings(): OperatorRating[] {
    return this.ratings.filter(c => {
      if (this.applied.stars && c.rating !== parseInt(this.applied.stars, 10)) return false;
      if (this.applied.type && c.service !== this.applied.type) return false;
      if (this.applied.date) {
        // c.date viene dd/mm/yyyy; el input de fecha da yyyy-mm-dd
        const [d, m, y] = c.date.split('/');
        if (`${y}-${m}-${d}` !== this.applied.date) return false;
      }
      return true;
    });
  }

  // genera un arreglo de estrellas para mostrar en el template
  getStars(count: number): number[] {
    return Array(5).fill(0).map((_, i) => i < count ? 1 : 0);
  }
}
